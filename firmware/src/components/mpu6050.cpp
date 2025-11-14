#include "mpu6050.h"
#include "config.h"

MPU6050Sensor::MPU6050Sensor() 
    : accelX(0), accelY(0), accelZ(0),
      gyroX(0), gyroY(0), gyroZ(0),
      temperature(0), initialized(false) {
}

bool MPU6050Sensor::begin(int sdaPin, int sclPin) {
    #if ENABLE_DEBUG_LOGS
    Serial.printf("[MPU6050] Initializing on SDA=%d, SCL=%d...\n", sdaPin, sclPin);
    #endif
    
    // Initialize I2C (Wire will handle multiple initializations safely)
    Wire.begin(sdaPin, sclPin);
    Wire.setClock(I2C_FREQUENCY);
    delay(200); // Critical delay for stability
    
    // Scan for I2C device
    #if ENABLE_DEBUG_LOGS
    Serial.print("[MPU6050] Scanning I2C bus... ");
    #endif
    
    Wire.beginTransmission(MPU6050_ADDR);
    byte error = Wire.endTransmission();
    
    if (error == 0) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("Device found at 0x%02X\n", MPU6050_ADDR);
        #endif
    } else {
        #if ENABLE_DEBUG_LOGS
        Serial.println("No device found!");
        // Try alternate address
        Wire.beginTransmission(0x69);
        error = Wire.endTransmission();
        if (error == 0) {
            Serial.println("[MPU6050] Found at alternate address 0x69!");
            Serial.println("[MPU6050] Update MPU6050_ADDR in config.h to 0x69");
        }
        #endif
    }
    
    // Try to initialize MPU6050
    if (!mpu.begin(MPU6050_ADDR, &Wire)) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[MPU6050] ❌ Sensor not found!");
        Serial.println("[MPU6050] Check wiring:");
        Serial.println("  - VCC → 3.3V");
        Serial.println("  - GND → GND");
        Serial.println("  - SDA → GPIO 21");
        Serial.println("  - SCL → GPIO 22");
        #endif
        initialized = false;
        return false;
    }
    
    #if ENABLE_DEBUG_LOGS
    Serial.println("[MPU6050] ✅ Sensor found!");
    #endif
    
    // Configure sensor ranges
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    
    #if ENABLE_DEBUG_LOGS
    Serial.println("[MPU6050] Configuration:");
    Serial.println("  - Accelerometer: ±8G");
    Serial.println("  - Gyroscope: ±500°/s");
    Serial.println("  - Filter: 21 Hz");
    #endif
    
    initialized = true;
    
    // Perform initial read to verify
    delay(100);
    if (!readSensorData()) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[MPU6050] ⚠️  Initial read failed");
        #endif
        return false;
    }
    
    #if ENABLE_DEBUG_LOGS
    Serial.println("[MPU6050] ✅ Initialization complete");
    #endif
    
    return true;
}

bool MPU6050Sensor::readSensorData() {
    if (!initialized) {
        return false;
    }
    
    sensors_event_t accel, gyro, temp;
    
    // Get sensor events
    if (!mpu.getEvent(&accel, &gyro, &temp)) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[MPU6050] ⚠️  Failed to read sensor");
        #endif
        return false;
    }
    
    // Store acceleration (m/s²)
    accelX = accel.acceleration.x;
    accelY = accel.acceleration.y;
    accelZ = accel.acceleration.z;
    
    // Store gyroscope (rad/s)
    gyroX = gyro.gyro.x;
    gyroY = gyro.gyro.y;
    gyroZ = gyro.gyro.z;
    
    // Store temperature (°C)
    temperature = temp.temperature;
    
    return true;
}

String MPU6050Sensor::detectOrientation() {
    if (!initialized) {
        return "Sensor Not Ready";
    }
    
    // Calculate total acceleration
    float totalAccel = calculateMagnitude(accelX, accelY, accelZ);
    
    // Free fall detection (very low acceleration)
    if (totalAccel < 5.0) {
        return "Free Fall";
    }
    
    // Determine dominant axis
    float absX = abs(accelX);
    float absY = abs(accelY);
    float absZ = abs(accelZ);
    
    // Z-axis dominant (normal orientation)
    if (absZ > absX && absZ > absY) {
        if (accelZ > 8.0) {
            return "Upright";
        } else if (accelZ < -8.0) {
            return "Upside Down";
        } else {
            return "Tilted";
        }
    }
    // X-axis dominant
    else if (absX > absY && absX > absZ) {
        if (accelX > 0) {
            return "On Side (Right)";
        } else {
            return "On Side (Left)";
        }
    }
    // Y-axis dominant
    else {
        if (accelY > 0) {
            return "On Edge (Front)";
        } else {
            return "On Edge (Back)";
        }
    }
}

bool MPU6050Sensor::detectVibration(float threshold) {
    if (!initialized) {
        return false;
    }
    
    float totalAccel = getTotalAcceleration();
    
    // Normal gravity ~9.8 m/s², vibration adds deviation
    float deviation = abs(totalAccel - 9.8);
    
    return deviation > threshold;
}

float MPU6050Sensor::getTotalAcceleration() {
    return calculateMagnitude(accelX, accelY, accelZ);
}

float MPU6050Sensor::calculateMagnitude(float x, float y, float z) {
    return sqrt(x*x + y*y + z*z);
}