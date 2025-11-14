#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

/********************* PROJECT *********************/
#define PROJECT_NAME "TRACEON"
#define FW_VERSION "1.0.0"
/********************* DEVICE ID *********************/
// Device name format: TRACEON_<LAST6HEX_MAC>
#define DEVICE_PREFIX "TRACEON_"

/********************* WIFI / PORTAL *****************/
// WiFiManager AP credentials (AP name generated at runtime from MAC)
#define WM_AP_PASSWORD "put_your_ap_password_here" // Minimum 8 characters
#define WIFI_CONNECT_TIMEOUT 30000 // 30 seconds
#define WIFI_PORTAL_TIMEOUT 180    // 3 minutes for config portal

/********************* DIRECT ACCESS AP **************/
// Simultaneous AP mode for universal access (no network config needed)
#define ENABLE_DIRECT_AP true      // Enable direct WiFi access point
#define DIRECT_AP_SUFFIX "_Direct" // Suffix for direct AP name
#define DIRECT_AP_CHANNEL 6        // WiFi channel (1-13)
#define DIRECT_AP_MAX_CLIENTS 4    // Max simultaneous connections

/********************* WEB SERVER *******************/
#define WEB_SERVER_PORT 80
#define WEB_TITLE "TRACEON Parcel Monitor"
#define WEB_REFRESH_MS 3000 // Refresh dashboard every 3 seconds
#define MDNS_HOSTNAME "traceon"  // Access via http://traceon.local

/********************* SCHEDULING *******************/
#define SENSOR_READ_INTERVAL 2000UL      // Read sensors every 2s (DHT11 needs 2s min)
#define SENSOR_UPLOAD_INTERVAL 2000UL   // Upload to Firebase every 2s
#define STATUS_UPDATE_INTERVAL 2000UL    // Update web status every 2s

/********************* DEBUG ***********************/
#define ENABLE_DEBUG_LOGS 1
#define DEBUG_SERIAL_BAUD 115200

/********************* DHT11 ***********************/
#define DHT11_PIN 4
#define DHTTYPE DHT11
#define DHT_MIN_INTERVAL 2000 // Minimum 2s between reads

/********************* MPU6050 (I2C) ****************/
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define I2C_FREQUENCY 400000
#define MPU6050_ADDR 0x68 // Default I2C address

/********************* THRESHOLDS ******************/
// Default alert thresholds (can be overridden via Firebase)
#define TEMP_MIN_THRESHOLD 5.0      // °C
#define TEMP_MAX_THRESHOLD 40.0     // °C
#define HUMIDITY_MIN_THRESHOLD 20.0 // %
#define HUMIDITY_MAX_THRESHOLD 80.0 // %
#define VIBRATION_THRESHOLD 15.0    // m/s²

/********************* STATUS LED *******************/
#define STATUS_LED_PIN 2
#define LED_ON HIGH   // Built-in LED is active HIGH on ESP32
#define LED_OFF LOW

/********************* FIREBASE (REST API) **********/
// Firebase Realtime Database configuration
#define FIREBASE_DATABASE_URL "put_your_database_url_here"  // e.g., "your-project-id.firebaseio.com"
#define FIREBASE_BASE_PATH "put_your_base_path_here"  // e.g., "parcels"
#define FIREBASE_AUTH_TOKEN "put_your_database_auth_token_here" 

// Memory optimization - reduced buffer sizes for ESP32-WROOM
#define JSON_BUFFER_SIZE 768        // Reduced from 1024
#define JSON_SMALL_BUFFER_SIZE 384  // For smaller payloads

/********************* MEMORY MANAGEMENT ************/
#define MIN_FREE_HEAP 50000  // Minimum free heap before warnings (50KB)
#define HEAP_CHECK_INTERVAL 60000 // Check heap every minute


#endif
