#ifndef MPU6050_H
#define MPU6050_H

#include <Arduino.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

/**
 * @brief MPU6050 6-Axis IMU Sensor Wrapper
 * 
 * Provides interface for:
 * - 3-axis accelerometer readings
 * - 3-axis gyroscope readings
 * - Orientation detection
 * - Vibration detection
 * - Temperature measurement
 */
class MPU6050Sensor {
public:
    /**
     * @brief Construct MPU6050 sensor object
     */
    MPU6050Sensor();
    
    /**
     * @brief Initialize MPU6050 with I2C pins
     * 
     * @param sdaPin SDA pin (default: 21)
     * @param sclPin SCL pin (default: 22)
     * @return true if initialization successful
     */
    bool begin(int sdaPin = 21, int sclPin = 22);
    
    /**
     * @brief Read all sensor data
     * 
     * @return true if read successful
     */
    bool readSensorData();
    
    // Accelerometer getters (m/s²)
    float getAccelX() const { return accelX; }
    float getAccelY() const { return accelY; }
    float getAccelZ() const { return accelZ; }
    
    // Gyroscope getters (rad/s)
    float getGyroX() const { return gyroX; }
    float getGyroY() const { return gyroY; }
    float getGyroZ() const { return gyroZ; }
    
    // Temperature getter (°C)
    float getTemperature() const { return temperature; }
    
    /**
     * @brief Detect package orientation
     * 
     * @return String describing orientation
     *         (Upright, Upside Down, On Side, Tilted, Free Fall)
     */
    String detectOrientation();
    
    /**
     * @brief Detect excessive vibration
     * 
     * @param threshold Vibration threshold in m/s² (default: 15.0)
     * @return true if vibration exceeds threshold
     */
    bool detectVibration(float threshold = 15.0);
    
    /**
     * @brief Get total acceleration magnitude
     * 
     * @return float Total acceleration (m/s²)
     */
    float getTotalAcceleration();
    
    /**
     * @brief Check if sensor is working
     * 
     * @return true if sensor initialized and responding
     */
    bool isConnected() const { return initialized; }

private:
    Adafruit_MPU6050 mpu;
    
    // Sensor data
    float accelX, accelY, accelZ;
    float gyroX, gyroY, gyroZ;
    float temperature;
    
    bool initialized;
    
    /**
     * @brief Calculate 3D vector magnitude
     */
    float calculateMagnitude(float x, float y, float z);
};

#endif // MPU6050_H