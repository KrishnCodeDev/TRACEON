/****************************************************
 * TRACEON - SMART PARCEL MONITORING SYSTEM v1.0
 * 
 * Hardware: ESP32-WROOM (4MB Flash, 370KB RAM)
 ****************************************************/
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>

#include "config.h"
#include "Components/mpu6050.h"
#include "Components/dht11.h"
#include "Components/asyncwebserver.h"

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================
MPU6050Sensor mpu;
DHT11Sensor dht(DHT11_PIN);
WebServerManager* webServer = nullptr;
WiFiManager wifiManager;
WiFiClientSecure httpsClient;

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
String DEVICE_NAME = "TRACEON_UNKNOWN";
String DEVICE_MAC = "";
unsigned long lastSensorRead = 0;
unsigned long lastUploadTime = 0;
unsigned long lastStatusUpdate = 0;
unsigned long lastHeapCheck = 0;

bool sensorsInitialized = false;
bool firebaseReady = false;
bool webServerStarted = false;

// ============================================================================
// FORWARD DECLARATIONS
// ============================================================================
String generateDeviceName();
String getMacAddress();
void setupSensors();
void setupWebServer();
void setupFirebase();
void readSensors();
void uploadToFirebase();
void checkAndUploadAlerts();
void checkHeapMemory();
void checkResetButton();
bool firebasePut(const String &path, const String &jsonPayload);
bool firebasePost(const String &path, const String &jsonPayload);
bool firebaseGet(const String &path, String &response);
unsigned long long getTimestampMillis();  // ✅ FIXED: Return 64-bit value

// ============================================================================
// WIFI RESET BUTTON
// ============================================================================
void checkResetButton() {
  static unsigned long resetPressStart = 0;
  const int RESET_BUTTON_PIN = 0; // GPIO 0 = BOOT button
  
  if (digitalRead(RESET_BUTTON_PIN) == LOW) {
    if (resetPressStart == 0) {
      resetPressStart = millis();
    } else if (millis() - resetPressStart > 5000) {
      #if ENABLE_DEBUG_LOGS
      Serial.println("\n[WiFi] 🔄 RESET - Clearing WiFi settings...");
      #endif
      
      for (int i = 0; i < 20; i++) {
        digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
        delay(100);
      }
      
      wifiManager.resetSettings();
      
      #if ENABLE_DEBUG_LOGS
      Serial.println("[WiFi] ✅ Settings cleared! Restarting...");
      #endif
      
      delay(1000);
      ESP.restart();
    }
  } else {
    resetPressStart = 0;
  }
}

// ============================================================================
// SETUP - INITIALIZATION
// ============================================================================
void setup() {
  Serial.begin(DEBUG_SERIAL_BAUD);
  delay(1000);
  
  #if ENABLE_DEBUG_LOGS
  Serial.println("\n\n");
  Serial.println("=====================================");
  Serial.println("   TRACEON PARCEL MONITORING v1.3");
  Serial.println("=====================================");
  Serial.printf("Chip Model: %s\n", ESP.getChipModel());
  Serial.printf("CPU Frequency: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash Size: %d MB\n", ESP.getFlashChipSize() / (1024 * 1024));
  Serial.printf("Free Heap: %d KB\n", ESP.getFreeHeap() / 1024);
  Serial.println("=====================================\n");
  #endif
  
  // Initialize status LED and reset button
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(0, INPUT_PULLUP); // BOOT button for reset
  digitalWrite(STATUS_LED_PIN, LED_OFF);
  
  // Get MAC address BEFORE WiFi
  uint64_t chipid = ESP.getEfuseMac();
  char macStr[13];
  sprintf(macStr, "%04X%08X", (uint16_t)(chipid>>32), (uint32_t)chipid);
  String tempMac = String(macStr);
  DEVICE_MAC = tempMac;
  
  String last6 = tempMac.substring(tempMac.length() - 6);
  DEVICE_NAME = String(DEVICE_PREFIX) + last6;
  
  webServer = new WebServerManager(&mpu, &dht, DEVICE_NAME);
  
  #if ENABLE_DEBUG_LOGS
  Serial.printf("[DEVICE] Name: %s\n", DEVICE_NAME.c_str());
  Serial.printf("[DEVICE] MAC: %s\n", DEVICE_MAC.c_str());
  #endif
  
  // ========== WiFiManager Setup ==========
  #if ENABLE_DEBUG_LOGS
  Serial.println("\n[WiFi] Starting WiFiManager...");
  Serial.printf("[WiFi] AP Name: %s\n", DEVICE_NAME.c_str());
  Serial.printf("[WiFi] AP Password: %s\n", WM_AP_PASSWORD);
  #endif
  
  wifiManager.setConfigPortalTimeout(WIFI_PORTAL_TIMEOUT);
  wifiManager.setConnectTimeout(WIFI_CONNECT_TIMEOUT / 1000);
  wifiManager.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  
  wifiManager.setAPCallback([](WiFiManager *myWiFiManager) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("\n[WiFi] ⚙️  CONFIGURATION MODE");
    Serial.println("=====================================");
    Serial.printf("Connect to AP: %s\n", myWiFiManager->getConfigPortalSSID().c_str());
    Serial.printf("Password: %s\n", WM_AP_PASSWORD);
    Serial.println("Go to: http://192.168.4.1");
    Serial.println("=====================================\n");
    #endif
    
    for (int i = 0; i < 10; i++) {
      digitalWrite(STATUS_LED_PIN, LED_ON);
      delay(100);
      digitalWrite(STATUS_LED_PIN, LED_OFF);
      delay(100);
    }
  });
  
  if (!wifiManager.autoConnect(DEVICE_NAME.c_str(), WM_AP_PASSWORD)) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[WiFi] ❌ Failed to connect, restarting...");
    #endif
    delay(3000);
    ESP.restart();
  }

  #if ENABLE_DEBUG_LOGS
  Serial.println("\n[WiFi] ✅ Connected!");
  Serial.printf("[WiFi] SSID: %s\n", WiFi.SSID().c_str());
  Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
  Serial.printf("[WiFi] Signal: %d%%\n", (WiFi.RSSI() + 100) * 2);
  #endif
  
  // ========== NTP Time Sync ==========
  #if ENABLE_DEBUG_LOGS
  Serial.print("\n[NTP] Syncing time with server... ");
  #endif
  
  configTime(19800, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
  
  int ntpRetries = 0;
  time_t now = time(nullptr);
  while (now < 1000000000 && ntpRetries < 30) {
    delay(500);
    now = time(nullptr);
    ntpRetries++;
    if (ntpRetries % 5 == 0) {
      Serial.print(".");
    }
  }
  
  #if ENABLE_DEBUG_LOGS
  if (now > 1000000000) {
    Serial.println(" ✅ Success");
    Serial.printf("[NTP] Current time: %s", ctime(&now));
    Serial.printf("[NTP] Unix timestamp: %lu\n", (unsigned long)now);
  } else {
    Serial.println(" ⚠️ Failed (using device uptime)");
  }
  #endif
  
  digitalWrite(STATUS_LED_PIN, LED_ON);
  
  // ========== mDNS Setup ==========
  #if ENABLE_DEBUG_LOGS
  Serial.print("\n[mDNS] Starting... ");
  #endif
  
  MDNS.end();
  delay(100);
  
  if (MDNS.begin(MDNS_HOSTNAME)) {
    MDNS.addService("http", "tcp", 80);
    #if ENABLE_DEBUG_LOGS
    Serial.println("✅ Success");
    Serial.printf("[mDNS] Access via: http://%s.local\n", MDNS_HOSTNAME);
    #endif
  } else {
    #if ENABLE_DEBUG_LOGS
    Serial.println("⚠️ Failed (not critical)");
    #endif
  }

  // ========== Simultaneous AP Mode ==========
  #if ENABLE_DEBUG_LOGS
  Serial.print("[AP] Starting simultaneous Access Point... ");
  #endif

  WiFi.mode(WIFI_AP_STA);
  bool apStarted = WiFi.softAP((DEVICE_NAME + "_Direct").c_str(), WM_AP_PASSWORD);

  if (apStarted) {
    IPAddress apIP = WiFi.softAPIP();
    #if ENABLE_DEBUG_LOGS
    Serial.println("✅ Success");
    Serial.printf("[AP] Direct Access SSID: %s\n", (DEVICE_NAME + "_Direct").c_str());
    Serial.printf("[AP] Direct Access Password: %s\n", WM_AP_PASSWORD);
    Serial.printf("[AP] Direct Access IP: http://%s\n", apIP.toString().c_str());
    #endif
  }
  
  setupSensors();
  setupWebServer();
  setupFirebase();
  
  // ========== System Ready ==========
  #if ENABLE_DEBUG_LOGS
  String ipAddress = WiFi.localIP().toString();
  String apIP = WiFi.softAPIP().toString();
  
  Serial.println("\n=====================================");
  Serial.println("   ✅ SYSTEM READY");
  Serial.println("=====================================");
  Serial.println("📡 NETWORK ACCESS METHODS:");
  Serial.println("-------------------------------------");
  Serial.printf("1️⃣  Router/Hotspot: http://%s\n", ipAddress.c_str());
  Serial.printf("2️⃣  mDNS Name: http://%s.local\n", MDNS_HOSTNAME);
  Serial.printf("3️⃣  Direct WiFi: '%s_Direct'\n", DEVICE_NAME.c_str());
  Serial.printf("    Password: %s\n", WM_AP_PASSWORD);
  Serial.printf("    Then: http://%s\n", apIP.c_str());
  Serial.println("-------------------------------------");
  Serial.printf("🔥 Firebase: /%s/%s\n", FIREBASE_BASE_PATH, DEVICE_NAME.c_str());
  Serial.println("=====================================\n");
  #endif
}

// ============================================================================
// LOOP - MAIN EXECUTION
// ============================================================================
void loop() {
  unsigned long now = millis();
  
  checkResetButton();
  
  if (WiFi.status() != WL_CONNECTED) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[WiFi] ⚠️ Connection lost, reconnecting...");
    #endif
    digitalWrite(STATUS_LED_PIN, LED_OFF);
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensors();
    lastSensorRead = now;
  }
  
  if (now - lastUploadTime >= SENSOR_UPLOAD_INTERVAL) {
    if (sensorsInitialized && firebaseReady) {
      uploadToFirebase();
      checkAndUploadAlerts();
    }
    lastUploadTime = now;
  }
  
  // ✅ ADD THIS: Refresh thresholds every 60 seconds
  static unsigned long lastThresholdCheck = 0;
  if (now - lastThresholdCheck >= 60000) {  // Every 60 seconds
    #if ENABLE_DEBUG_LOGS
    Serial.println("[THRESHOLDS] Refreshing from Firebase...");
    #endif
    lastThresholdCheck = now;
    // Thresholds will be read in next checkAndUploadAlerts() call
  }

  if (now - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
    webServer->setWiFiInfo(WiFi.SSID(), WiFi.RSSI());
    webServer->setFirebaseStatus(firebaseReady);
    lastStatusUpdate = now;
  }
  
  static unsigned long lastStatusCheck = 0;
  if (now - lastStatusCheck >= 30000) {
    if (firebaseReady) {
      String assignmentPath = String(FIREBASE_BASE_PATH) + "/" + DEVICE_NAME + "/info/assignedParcelId";
      String response;
      if (firebaseGet(assignmentPath, response)) {
        response.replace("\"", "");
        if (response != "null" && response.length() > 2) {
          webServer->setDeviceStatus("Assigned to Parcel");
        } else {
          webServer->setDeviceStatus("Available");
        }
      }
    }
    lastStatusCheck = now;
  }
  
  if (now - lastHeapCheck >= HEAP_CHECK_INTERVAL) {
    checkHeapMemory();
    lastHeapCheck = now;
  }
  
  delay(10);
}

// ============================================================================
// SENSOR INITIALIZATION
// ============================================================================
void setupSensors() {
  #if ENABLE_DEBUG_LOGS
  Serial.println("\n[SENSORS] Initializing...");
  #endif
  
  bool mpuOk = false;
  bool dhtOk = false;
  
  delay(500);
  
  if (mpu.begin(I2C_SDA_PIN, I2C_SCL_PIN)) {
    mpuOk = true;
  }
  
  if (dht.begin()) {
    dhtOk = true;
  }
  
  sensorsInitialized = (mpuOk || dhtOk);
  
  if (sensorsInitialized) {
    if (mpuOk && dhtOk) {
      webServer->setDeviceStatus("All Sensors Ready");
    } else if (dhtOk) {
      webServer->setDeviceStatus("DHT11 Only");
    } else if (mpuOk) {
      webServer->setDeviceStatus("MPU6050 Only");
    }
  } else {
    webServer->setDeviceStatus("Sensor Error");
  }
}

// ============================================================================
// WEB SERVER INITIALIZATION
// ============================================================================
void setupWebServer() {
  webServer->setWiFiInfo(WiFi.SSID(), WiFi.RSSI());
  
  #if ENABLE_DEBUG_LOGS
  Serial.print("\n[WEB] Starting server on port 80... ");
  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
  #endif
  
  if (webServer->begin(WEB_SERVER_PORT)) {
    webServerStarted = true;
    webServer->setDeviceStatus("Online");
    
    #if ENABLE_DEBUG_LOGS
    Serial.println("[WEB] ✅ Success");
    Serial.printf("[WEB] Access at: http://%s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WEB] Or via mDNS: http://%s.local\n", MDNS_HOSTNAME);
    #endif
  } else {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[WEB] ❌ Failed");
    #endif
  }
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
void setupFirebase() {
  #if ENABLE_DEBUG_LOGS
  Serial.println("\n[FIREBASE] Initializing...");
  #endif
  
  httpsClient.setInsecure();
  
  String devicePath = String(FIREBASE_BASE_PATH) + "/" + DEVICE_NAME + "/info";
  String infoPath = devicePath + "/info";

  // ✅ CRITICAL FIX: Read existing data BEFORE updating
  String existingData;
  String existingAssignedParcelId = "";
  bool hasCustomThresholds = false;
  
  if (firebaseGet(infoPath, existingData)) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] ✅ Found existing device data");
    #endif
    
    // Parse existing data
    StaticJsonDocument<1024> existingDoc;
    deserializeJson(existingDoc, existingData);
    
    // Extract assigned parcel ID
    if (existingDoc.containsKey("assignedParcelId")) {
      existingAssignedParcelId = existingDoc["assignedParcelId"].as<String>();
      if (existingAssignedParcelId.length() > 0) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("[FIREBASE] 🔗 Device is assigned to: %s\n", existingAssignedParcelId.c_str());
        #endif
        hasCustomThresholds = true;
      }
    }
  }
  
  // ✅ FIXED: Use 64-bit timestamp
  unsigned long long timestamp = getTimestampMillis();
  char timestampBuffer[20];
  sprintf(timestampBuffer, "%llu", timestamp);
  
  StaticJsonDocument<JSON_SMALL_BUFFER_SIZE> infoDoc;
  infoDoc["deviceName"] = DEVICE_NAME;
  infoDoc["macAddress"] = DEVICE_MAC;
  infoDoc["firmwareVersion"] = FW_VERSION;

  // ✅ PRESERVE registeredAt if exists
  if (existingData.length() > 0) {
    StaticJsonDocument<1024> existingDoc;
    deserializeJson(existingDoc, existingData);
    if (existingDoc.containsKey("registeredAt")) {
      infoDoc["registeredAt"] = existingDoc["registeredAt"];
    } else {
      infoDoc["registeredAt"] = timestampBuffer;
    }
  } else {
    infoDoc["registeredAt"] = timestampBuffer;
  }
  
  // ✅ PRESERVE assignedParcelId
  if (existingAssignedParcelId.length() > 0) {
    infoDoc["assignedParcelId"] = existingAssignedParcelId;
    infoDoc["status"] = "assigned";  // Keep assigned status
  } else {
    infoDoc["assignedParcelId"] = "";
    infoDoc["status"] = "available";
  }

  // infoDoc["registeredAt"] = timestampBuffer;  // ✅ Send as string
  // infoDoc["status"] = "available";
  // infoDoc["assignedParcelId"] = "";
  infoDoc["lastSeen"] = timestampBuffer;  // ✅ Send as string
  infoDoc["ipAddress"] = WiFi.localIP().toString();
  infoDoc["wifiSSID"] = WiFi.SSID();
  infoDoc["localAccess"] = "http://" + WiFi.localIP().toString();
  infoDoc["mdnsAccess"] = "http://" + String(MDNS_HOSTNAME) + ".local";

  // ✅ PRESERVE custom thresholds if assigned
  if (hasCustomThresholds) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] 🔧 Preserving custom thresholds from parcel assignment");
    #endif
    // Don't overwrite thresholds - keep existing ones from parcel
  } else {
    // Only set default thresholds if not assigned
    JsonObject thresholds = infoDoc.createNestedObject("thresholds");
    thresholds["temperature"]["min"] = TEMP_MIN_THRESHOLD;
    thresholds["temperature"]["max"] = TEMP_MAX_THRESHOLD;
    thresholds["humidity"]["min"] = HUMIDITY_MIN_THRESHOLD;
    thresholds["humidity"]["max"] = HUMIDITY_MAX_THRESHOLD;
    thresholds["vibration"] = VIBRATION_THRESHOLD;
  }
  
  String infoJson;
  serializeJson(infoDoc, infoJson);
  
  #if ENABLE_DEBUG_LOGS
  Serial.printf("[FIREBASE] Registering at: %s\n", devicePath.c_str());
  Serial.printf("[FIREBASE] Timestamp: %s\n", timestampBuffer);
  #endif
  
  if (firebasePut(infoPath, infoJson)) {
    firebaseReady = true;
    webServer->setFirebaseStatus(true);
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] ✅ Device updated successfully");
    if (existingAssignedParcelId.length() > 0) {
      Serial.println("[FIREBASE] ✅ Parcel assignment preserved!");
    }
    #endif
  } else {
    firebaseReady = false;
    webServer->setFirebaseStatus(false);
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] ❌ Failed to update device");
    #endif
  }

  if (firebasePut(devicePath, infoJson)) {
    firebaseReady = true;
    webServer->setFirebaseStatus(true);
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] ✅ Device registered");
    #endif
  } else {
    firebaseReady = false;
    webServer->setFirebaseStatus(false);
  }
}

// ============================================================================
// SENSOR READING
// ============================================================================
void readSensors() {
  if (!sensorsInitialized) return;
  
  if (mpu.isConnected()) {
    mpu.readSensorData();
  }
  
  if (dht.isValid()) {
    dht.readSensor();
  }
}

// ============================================================================
// FIREBASE UPLOAD
// ============================================================================
void uploadToFirebase() {
  String devicePathBase = String(FIREBASE_BASE_PATH) + "/" + DEVICE_NAME;
  
  // ✅ FIXED: Get 64-bit timestamp
  unsigned long long timestampMillis = getTimestampMillis();
  char timestampBuffer[20];
  sprintf(timestampBuffer, "%llu", timestampMillis);
  
  StaticJsonDocument<JSON_BUFFER_SIZE> currentDoc;
  
  currentDoc["timestamp"] = timestampBuffer;  // ✅ Send as string
  currentDoc["state"] = "Monitoring";
  
  if (dht.isValid()) {
    currentDoc["temperature"] = round(dht.getTemperature() * 10) / 10.0;
    currentDoc["humidity"] = round(dht.getHumidity() * 10) / 10.0;
    currentDoc["heatIndex"] = round(dht.getHeatIndex() * 10) / 10.0;
  } else {
    currentDoc["temperature"] = 0;
    currentDoc["humidity"] = 0;
    currentDoc["heatIndex"] = 0;
  }
  
  if (mpu.isConnected()) {
    currentDoc["accelX"] = round(mpu.getAccelX() * 100) / 100.0;
    currentDoc["accelY"] = round(mpu.getAccelY() * 100) / 100.0;
    currentDoc["accelZ"] = round(mpu.getAccelZ() * 100) / 100.0;
    currentDoc["gyroX"] = round(mpu.getGyroX() * 100) / 100.0;
    currentDoc["gyroY"] = round(mpu.getGyroY() * 100) / 100.0;
    currentDoc["gyroZ"] = round(mpu.getGyroZ() * 100) / 100.0;
    currentDoc["orientation"] = mpu.detectOrientation();
    currentDoc["vibration"] = mpu.detectVibration();
  } else {
    currentDoc["accelX"] = 0;
    currentDoc["accelY"] = 0;
    currentDoc["accelZ"] = 0;
    currentDoc["gyroX"] = 0;
    currentDoc["gyroY"] = 0;
    currentDoc["gyroZ"] = 0;
    currentDoc["orientation"] = "Sensor Error";
    currentDoc["vibration"] = false;
  }
  
  currentDoc["wifiSSID"] = WiFi.SSID();
  currentDoc["wifiRSSI"] = WiFi.RSSI();
  
  String jsonStr;
  serializeJson(currentDoc, jsonStr);
  
  String currentPath = devicePathBase + "/current";
  if (firebasePut(currentPath, jsonStr)) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[FIREBASE] ✅ Data uploaded");
    #endif
    
    String historyPath = devicePathBase + "/history";
    firebasePost(historyPath, jsonStr);
    
    // ✅ FIXED: Update lastSeen with full 64-bit timestamp as string
    String lastSeenPath = devicePathBase + "/info/lastSeen";
    String lastSeenPayload = "\"" + String(timestampBuffer) + "\"";  // Wrap in quotes for Firebase
    
    #if ENABLE_DEBUG_LOGS
    Serial.printf("[FIREBASE] Updating lastSeen: %s\n", timestampBuffer);
    #endif
    
    firebasePut(lastSeenPath, lastSeenPayload);
    
    webServer->setFirebaseStatus(true);
    firebaseReady = true;
  } else {
    webServer->setFirebaseStatus(false);
    firebaseReady = false;
  }
}

// ============================================================================
// ALERT CHECKING
// ============================================================================
void checkAndUploadAlerts() {
  if (!sensorsInitialized || !firebaseReady) return;
  
  String devicePathBase = String(FIREBASE_BASE_PATH) + "/" + DEVICE_NAME;

  // ✅ READ THRESHOLDS FROM FIREBASE (not config.h)
  String thresholdsPath = devicePathBase + "/info/thresholds";
  String response;
  
  float tempMin = TEMP_MIN_THRESHOLD; // Defaults
  float tempMax = TEMP_MAX_THRESHOLD;
  float humidMin = HUMIDITY_MIN_THRESHOLD;
  float humidMax = HUMIDITY_MAX_THRESHOLD;
  float vibThreshold = VIBRATION_THRESHOLD;
  
  // Try to read from Firebase
  if (firebaseGet(thresholdsPath, response)) {
    StaticJsonDocument<512> doc;
    deserializeJson(doc, response);
    
    if (doc.containsKey("temperature")) {
      tempMin = doc["temperature"]["min"] | TEMP_MIN_THRESHOLD;
      tempMax = doc["temperature"]["max"] | TEMP_MAX_THRESHOLD;
    }
    if (doc.containsKey("humidity")) {
      humidMin = doc["humidity"]["min"] | HUMIDITY_MIN_THRESHOLD;
      humidMax = doc["humidity"]["max"] | HUMIDITY_MAX_THRESHOLD;
    }
    if (doc.containsKey("vibration")) {
      vibThreshold = doc["vibration"] | VIBRATION_THRESHOLD;
    }
    
    #if ENABLE_DEBUG_LOGS
    Serial.println("[ALERTS] ✅ Using Firebase thresholds:");
    Serial.printf("  Temp: %.1f - %.1f°C\n", tempMin, tempMax);
    Serial.printf("  Humidity: %.1f - %.1f%%\n", humidMin, humidMax);
     Serial.printf("  Vibration: %.1f m/s²\n", vibThreshold);
    #endif
  } else {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[ALERTS] ℹ️ No custom thresholds found, using defaults");
    #endif
  }

  String alertsPath = devicePathBase + "/alerts";
  
  // ✅ FIXED: Get 64-bit timestamp
  unsigned long long timestampMillis = getTimestampMillis();
  char timestampBuffer[20];
  sprintf(timestampBuffer, "%llu", timestampMillis);
  
  if (dht.isValid()) {
    float temp = dht.getTemperature();
    
    if (temp < tempMin || temp > tempMax) {
      StaticJsonDocument<JSON_SMALL_BUFFER_SIZE> alertDoc;
      alertDoc["type"] = "temperature";
      alertDoc["severity"] = (temp > tempMax) ? "critical" : "warning";
      alertDoc["message"] = (temp > tempMax) ? 
                           "Temperature exceeded maximum" : "Temperature below minimum";
      alertDoc["value"] = temp;
      alertDoc["threshold"] = (temp > tempMax) ? tempMax : tempMin;
      alertDoc["timestamp"] = timestampBuffer;  // ✅ Send as string
      alertDoc["resolved"] = false;
      
      String alertJson;
      serializeJson(alertDoc, alertJson);
      firebasePost(alertsPath, alertJson);

      if (firebasePost(alertsPath, alertJson)) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("[ALERTS] 🚨 Temperature alert sent: %.1f°C (threshold: %.1f°C)\n", 
                      temp, (temp > tempMax) ? tempMax : tempMin);
        #endif
      }
    }
    
    float humid = dht.getHumidity();

    if (humid < humidMin || humid > humidMax) {
      StaticJsonDocument<JSON_SMALL_BUFFER_SIZE> alertDoc;
      alertDoc["type"] = "humidity";
      alertDoc["severity"] = (humid > humidMax) ? "critical" : "warning";
      alertDoc["message"] = (temp > humidMax) ? 
                           "Humidity exceeded maximum" : "Humidity below minimum";
      alertDoc["value"] = humid;
      alertDoc["threshold"] = (humid > humidMax) ? humidMax : humidMin;
      alertDoc["timestamp"] = timestampBuffer;  // ✅ Send as string
      alertDoc["resolved"] = false;
      
      String alertJson;
      serializeJson(alertDoc, alertJson);
      firebasePost(alertsPath, alertJson);

      if (firebasePost(alertsPath, alertJson)) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("[ALERTS] 🚨 Humidity alert sent: %.1f%% (threshold: %.1f%%)\n", 
                      humid, (humid > humidMax) ? humidMax : humidMin);
        #endif
      }
    }
  }
  
  // ========== VIBRATION ALERTS (using synced threshold) ==========
  if (mpu.isConnected() && mpu.detectVibration(vibThreshold)) {
    StaticJsonDocument<JSON_SMALL_BUFFER_SIZE> alertDoc;
    alertDoc["type"] = "vibration";
    alertDoc["severity"] = "warning";
    alertDoc["message"] = "Excessive vibration detected - possible rough handling";
    alertDoc["value"] = mpu.getTotalAcceleration();
    alertDoc["threshold"] = vibThreshold;
    alertDoc["timestamp"] = timestampBuffer;  // ✅ Send as string
    alertDoc["resolved"] = false;
    
    String alertJson;
    serializeJson(alertDoc, alertJson);
    firebasePost(alertsPath, alertJson);

    if (firebasePost(alertsPath, alertJson)) {
      #if ENABLE_DEBUG_LOGS
      Serial.printf("[ALERTS] 🚨 Vibration alert sent: %.2f m/s² (threshold: %.2f m/s²)\n", 
                    mpu.getTotalAcceleration(), vibThreshold);
      #endif
    }
  }

  // ========== ORIENTATION ALERTS ==========
  if (mpu.isConnected()) {
    String orientation = mpu.detectOrientation();
    
    if (orientation == "Upside Down" || orientation == "Free Fall") {
      StaticJsonDocument<JSON_SMALL_BUFFER_SIZE> alertDoc;
      alertDoc["type"] = "orientation";
      alertDoc["severity"] = "critical";
      alertDoc["message"] = "Dangerous orientation detected: " + orientation;
      alertDoc["value"] = orientation;
      alertDoc["timestamp"] = timestampBuffer;
      alertDoc["resolved"] = false;
      
      String alertJson;
      serializeJson(alertDoc, alertJson);
      firebasePost(alertsPath, alertJson);
      
      if (firebasePost(alertsPath, alertJson)) {
        #if ENABLE_DEBUG_LOGS
        Serial.printf("[ALERTS] 🚨 Orientation alert sent: %s\n", orientation.c_str());
        #endif
      }
    }
  }
}

// ============================================================================
// FIREBASE REST API HELPERS
// ============================================================================
bool firebasePut(const String &path, const String &jsonPayload) {
  if (String(FIREBASE_DATABASE_URL).length() == 0) return false;
  
  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + "/" + path + ".json";
  
  if (String(FIREBASE_AUTH_TOKEN).length() > 0) {
    url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
  }
  
  http.begin(httpsClient, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  int httpCode = http.PUT(jsonPayload);
  bool success = (httpCode >= 200 && httpCode < 300);
  
  http.end();
  return success;
}

bool firebasePost(const String &path, const String &jsonPayload) {
  if (String(FIREBASE_DATABASE_URL).length() == 0) return false;
  
  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + "/" + path + ".json";
  
  if (String(FIREBASE_AUTH_TOKEN).length() > 0) {
    url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
  }
  
  http.begin(httpsClient, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  int httpCode = http.POST(jsonPayload);
  bool success = (httpCode >= 200 && httpCode < 300);
  
  http.end();
  return success;
}

bool firebaseGet(const String &path, String &response) {
  if (String(FIREBASE_DATABASE_URL).length() == 0) return false;
  
  HTTPClient http;
  String url = String(FIREBASE_DATABASE_URL) + "/" + path + ".json";
  
  if (String(FIREBASE_AUTH_TOKEN).length() > 0) {
    url += "?auth=" + String(FIREBASE_AUTH_TOKEN);
  }
  
  http.begin(httpsClient, url);
  http.setTimeout(10000);
  
  int httpCode = http.GET();
  
  if (httpCode >= 200 && httpCode < 300) {
    response = http.getString();
    http.end();
    return true;
  }
  
  http.end();
  return false;
}

// ============================================================================
// TIMESTAMP FUNCTION - ✅ CRITICAL FIX APPLIED
// ============================================================================
unsigned long long getTimestampMillis() {  // ✅ FIXED: Return 64-bit
  time_t nowSeconds = time(nullptr);
  
  if (nowSeconds > 1577836800) { // After Jan 1, 2020
    // ✅ FIXED: Proper 64-bit handling
    unsigned long long milliseconds = (unsigned long long)nowSeconds * 1000ULL;
    
    #if ENABLE_DEBUG_LOGS
    static unsigned long lastLog = 0;
    if (millis() - lastLog > 10000) { // Log every 10 seconds
      Serial.printf("[TIMESTAMP] NTP seconds: %lu\n", (unsigned long)nowSeconds);
      Serial.printf("[TIMESTAMP] Milliseconds: %llu\n", milliseconds);
      lastLog = millis();
    }
    #endif
    
    return milliseconds;  // ✅ Return full 64-bit value
  } else {
    #if ENABLE_DEBUG_LOGS
    static bool warningShown = false;
    if (!warningShown) {
      Serial.println("[TIMESTAMP] ⚠️ Using millis() - NTP not synced");
      warningShown = true;
    }
    #endif
    return (unsigned long long)millis();  // ✅ Cast to match return type
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
void checkHeapMemory() {
  uint32_t freeHeap = ESP.getFreeHeap();
  
  #if ENABLE_DEBUG_LOGS
  Serial.printf("[MEMORY] Free Heap: %d KB / %d KB\n", 
                freeHeap / 1024, 
                ESP.getHeapSize() / 1024);
  #endif
  
  if (freeHeap < MIN_FREE_HEAP) {
    #if ENABLE_DEBUG_LOGS
    Serial.println("[MEMORY] ⚠️ Low memory warning!");
    #endif
  }
}