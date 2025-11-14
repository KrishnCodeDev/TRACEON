#include "dht11.h"
#include "config.h"

DHT11Sensor::DHT11Sensor(uint8_t pin) 
    : dht(pin, DHTTYPE), pin(pin), 
      temperature(0), humidity(0), 
      dataValid(false), lastReadTime(0) {
}

bool DHT11Sensor::begin() {
    #if ENABLE_DEBUG_LOGS
    Serial.printf("[DHT11] Initializing on pin %d...\n", pin);
    #endif
    
    dht.begin();
    
    // Give sensor time to stabilize (DHT11 requires ~2 seconds)
    delay(2000);
    
    // Test read
    if (readSensor()) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[DHT11] ✅ Sensor initialized");
        Serial.printf("[DHT11] Initial - Temp: %.1f°C, Humidity: %.1f%%\n", 
                      temperature, humidity);
        #endif
        return true;
    } else {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[DHT11] ⚠️  Sensor found but initial read failed");
        Serial.println("[DHT11] Check wiring:");
        Serial.println("  - VCC → 3.3V");
        Serial.println("  - GND → GND");
        Serial.println("  - DATA → GPIO 4");
        Serial.println("  - Add 4.7-10kΩ pull-up resistor between DATA and VCC");
        #endif
        return false;
    }
}

bool DHT11Sensor::readSensor() {
    // DHT11 requires minimum 2-second interval between reads
    unsigned long currentTime = millis();
    if (currentTime - lastReadTime < READ_INTERVAL) {
        // Too soon, return last valid state
        return dataValid;
    }
    
    lastReadTime = currentTime;
    
    // Read temperature and humidity
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    
    // Check if readings are valid (not NaN)
    if (isnan(h) || isnan(t)) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[DHT11] ❌ Read failed - NaN values");
        #endif
        dataValid = false;
        return false;
    }
    
    // Validate ranges (DHT11 specs: 0-50°C, 20-90% RH)
    // Allow slightly wider range for tolerance
    if (t < -10 || t > 60 || h < 0 || h > 100) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("[DHT11] ⚠️  Out of range - T: %.1f°C, H: %.1f%%\n", t, h);
        #endif
        dataValid = false;
        return false;
    }
    
    // Store valid readings
    temperature = t;
    humidity = h;
    dataValid = true;
    
    #if ENABLE_DEBUG_LOGS
    // Uncomment for verbose logging
    // Serial.printf("[DHT11] T: %.1f°C, H: %.1f%%\n", temperature, humidity);
    #endif
    
    return true;
}

float DHT11Sensor::getHeatIndex(bool fahrenheit) {
    if (!dataValid) {
        return NAN;
    }
    
    return dht.computeHeatIndex(temperature, humidity, fahrenheit);
}

bool DHT11Sensor::isTemperatureAlert(float minTemp, float maxTemp) {
    if (!dataValid) {
        return false;
    }
    
    return (temperature < minTemp || temperature > maxTemp);
}

bool DHT11Sensor::isHumidityAlert(float minHumidity, float maxHumidity) {
    if (!dataValid) {
        return false;
    }
    
    return (humidity < minHumidity || humidity > maxHumidity);
}