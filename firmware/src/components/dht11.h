#ifndef DHT11_H
#define DHT11_H

#include <Arduino.h>
#include <DHT.h>

/**
 * @brief DHT11 Temperature & Humidity Sensor Wrapper
 * 
 * Provides interface for:
 * - Temperature measurement (°C)
 * - Humidity measurement (%)
 * - Heat index calculation
 * - Alert threshold checking
 */
class DHT11Sensor {
public:
    /**
     * @brief Construct DHT11 sensor object
     * 
     * @param pin GPIO pin connected to DHT11 data line
     */
    DHT11Sensor(uint8_t pin);
    
    /**
     * @brief Initialize DHT11 sensor
     * 
     * @return true if initialization successful
     */
    bool begin();
    
    /**
     * @brief Read temperature and humidity
     * 
     * @return true if read successful
     */
    bool readSensor();
    
    /**
     * @brief Get last temperature reading
     * 
     * @return float Temperature in °C
     */
    float getTemperature() const { return temperature; }
    
    /**
     * @brief Get last humidity reading
     * 
     * @return float Humidity percentage (0-100%)
     */
    float getHumidity() const { return humidity; }
    
    /**
     * @brief Calculate heat index (feels-like temperature)
     * 
     * @param fahrenheit Return in Fahrenheit (default: false)
     * @return float Heat index
     */
    float getHeatIndex(bool fahrenheit = false);
    
    /**
     * @brief Check if sensor data is valid
     * 
     * @return true if last reading was successful
     */
    bool isValid() const { return dataValid; }
    
    /**
     * @brief Check for temperature alert
     * 
     * @param minTemp Minimum safe temperature (default: 0°C)
     * @param maxTemp Maximum safe temperature (default: 40°C)
     * @return true if temperature outside safe range
     */
    bool isTemperatureAlert(float minTemp = 0.0, float maxTemp = 40.0);
    
    /**
     * @brief Check for humidity alert
     * 
     * @param minHumidity Minimum safe humidity (default: 20%)
     * @param maxHumidity Maximum safe humidity (default: 80%)
     * @return true if humidity outside safe range
     */
    bool isHumidityAlert(float minHumidity = 20.0, float maxHumidity = 80.0);

private:
    DHT dht;
    uint8_t pin;
    
    float temperature;
    float humidity;
    bool dataValid;
    
    unsigned long lastReadTime;
    static const unsigned long READ_INTERVAL = 2000; // DHT11 minimum 2 seconds
};

#endif // DHT11_H