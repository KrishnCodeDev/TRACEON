#ifndef ASYNCWEBSERVER_H
#define ASYNCWEBSERVER_H

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>

// Forward declarations
class MPU6050Sensor;
class DHT11Sensor;

/**
 * @brief Async Web Server Manager for TRACEON Dashboard
 * 
 * Provides HTTP endpoints:
 * - / (GET) - Dashboard HTML interface
 * - /api/sensors (GET) - Real-time sensor data (JSON)
 * - /api/status (GET) - Device status (JSON)
 * - /api/info (GET) - System information (JSON)
 */
class WebServerManager {
public:
    /**
     * @brief Construct web server manager
     * 
     * @param mpuSensor Pointer to MPU6050 instance
     * @param dhtSensor Pointer to DHT11 instance
     * @param devName Device name string
     */
    WebServerManager(MPU6050Sensor* mpuSensor, DHT11Sensor* dhtSensor, const String& devName);
    
    /**
     * @brief Start web server
     * 
     * @param port HTTP port (default: 80)
     * @return true if server started successfully
     */
    bool begin(uint16_t port = 80);
    
    /**
     * @brief Get server instance reference
     */
    AsyncWebServer& getServer() { return server; }
    
    /**
     * @brief Update device status message
     * 
     * @param status Status string (e.g., "Online", "Monitoring")
     */
    void setDeviceStatus(const String& status);
    
    /**
     * @brief Update WiFi connection info
     * 
     * @param ssid Connected SSID
     * @param rssi Signal strength (dBm)
     */
    void setWiFiInfo(const String& ssid, int rssi);
    
    /**
     * @brief Update Firebase connection status
     * 
     * @param connected Connection state
     */
    void setFirebaseStatus(bool connected);

private:
    AsyncWebServer server;
    
    MPU6050Sensor* mpu;
    DHT11Sensor* dht;
    
    String deviceName;     // Device name
    String deviceStatus;
    String wifiSSID;
    int wifiRSSI;
    bool firebaseConnected;
    
    /**
     * @brief Setup all HTTP routes
     */
    void setupRoutes();
    
    /**
     * @brief Generate dashboard HTML (optimized for memory)
     */
    String generateDashboardHTML();
    
    /**
     * @brief Generate sensor data JSON
     */
    String generateSensorJSON();
    
    /**
     * @brief Generate device status JSON
     */
    String generateStatusJSON();
    
    /**
     * @brief Handle 404 errors
     */
    void handleNotFound(AsyncWebServerRequest* request);
    
    /**
     * @brief Convert RSSI to signal percentage
     * 
     * @param rssi Signal strength in dBm
     * @return int Signal quality (0-100%)
     */
    int rssiToPercent(int rssi);
};

#endif // ASYNCWEBSERVER_H