#include "Components/asyncwebserver.h"
#include "Components/mpu6050.h"
#include "Components/dht11.h"
#include "config.h"

WebServerManager::WebServerManager(MPU6050Sensor* mpuSensor, DHT11Sensor* dhtSensor, const String& devName)
    : server(WEB_SERVER_PORT), mpu(mpuSensor), dht(dhtSensor), deviceName(devName),
      deviceStatus("Initializing"), wifiSSID("Not Connected"), 
      wifiRSSI(-100), firebaseConnected(false) {
}

bool WebServerManager::begin(uint16_t port) {
    #if ENABLE_DEBUG_LOGS
    Serial.printf("[WebServer] Starting on port %d...\n", port);
    #endif
    
    // Add small delay to ensure port is fully released
    delay(500);
    
    setupRoutes();
    
    // Try to start server with error handling
    try {
        server.begin();
        #if ENABLE_DEBUG_LOGS
        Serial.println("[WebServer] ✅ Server started successfully");
        #endif
        return true;
    } catch (...) {
        #if ENABLE_DEBUG_LOGS
        Serial.println("[WebServer] ❌ Failed to start server");
        Serial.println("[WebServer] Port may be in use - trying restart...");
        #endif
        
        // Attempt recovery
        delay(2000);
        server.begin();
        
        #if ENABLE_DEBUG_LOGS
        Serial.println("[WebServer] ✅ Server started on retry");
        #endif
        return true;
    }
}

void WebServerManager::setupRoutes() {
    // Root - Dashboard HTML
    server.on("/", HTTP_GET, [this](AsyncWebServerRequest* request) {
        request->send(200, "text/html", generateDashboardHTML());
    });
    
    // API - Sensor Data JSON
    server.on("/api/sensors", HTTP_GET, [this](AsyncWebServerRequest* request) {
        request->send(200, "application/json", generateSensorJSON());
    });
    
    // API - Device Status JSON
    server.on("/api/status", HTTP_GET, [this](AsyncWebServerRequest* request) {
        request->send(200, "application/json", generateStatusJSON());
    });
    
    // API - System Info
    server.on("/api/info", HTTP_GET, [this](AsyncWebServerRequest* request) {
        String json = "{";
        json += "\"device\":\"" + deviceName + "\",";
        json += "\"version\":\"" + String(FW_VERSION) + "\",";
        json += "\"uptime\":" + String(millis() / 1000) + ",";
        json += "\"freeHeap\":" + String(ESP.getFreeHeap()) + ",";
        json += "\"chipModel\":\"" + String(ESP.getChipModel()) + "\",";
        json += "\"cpuFreq\":" + String(ESP.getCpuFreqMHz());
        json += "}";
        request->send(200, "application/json", json);
    });
    
    // Handle 404
    server.onNotFound([this](AsyncWebServerRequest* request) {
        handleNotFound(request);
    });
}

String WebServerManager::generateDashboardHTML() {
    // Memory-optimized HTML - split into smaller chunks
    String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width,initial-scale=1.0'>";
    html += "<title>" + String(WEB_TITLE) + "</title>";
    
    // Minified CSS
    html += "<style>";
    html += "*{margin:0;padding:0;box-sizing:border-box}";
    html += "body{font-family:Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}";
    html += ".container{max-width:1200px;margin:0 auto}";
    html += ".header{background:#fff;padding:20px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);margin-bottom:20px;text-align:center}";
    html += ".header h1{color:#333;font-size:28px;margin-bottom:5px}";
    html += ".device-name{color:#666;font-size:14px}";
    html += ".status-bar{background:#fff;padding:15px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);margin-bottom:20px;display:flex;justify-content:space-around;flex-wrap:wrap;gap:15px}";
    html += ".status-item{text-align:center}";
    html += ".status-label{font-size:12px;color:#666;margin-bottom:5px}";
    html += ".status-value{font-size:16px;font-weight:bold;color:#333}";
    html += ".status-value.connected{color:#10b981}";
    html += ".status-value.disconnected{color:#ef4444}";
    html += ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-bottom:20px}";
    html += ".card{background:#fff;padding:20px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}";
    html += ".card h2{color:#333;font-size:18px;margin-bottom:15px;border-bottom:2px solid #667eea;padding-bottom:10px}";
    html += ".sensor-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}";
    html += ".sensor-row:last-child{border-bottom:none}";
    html += ".sensor-label{color:#666;font-size:14px}";
    html += ".sensor-value{font-weight:bold;color:#333;font-size:16px}";
    html += ".alert{background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:5px;margin-top:10px}";
    html += ".alert.danger{background:#fee2e2;border-left-color:#ef4444}";
    html += ".alert-text{color:#92400e;font-size:14px}";
    html += ".alert.danger .alert-text{color:#991b1b}";
    html += ".footer{text-align:center;color:#fff;margin-top:20px;font-size:14px}";
    html += "@media (max-width:768px){.grid{grid-template-columns:1fr}.status-bar{flex-direction:column}}";
    html += "</style></head><body>";
    
    // Body content
    html += "<div class='container'>";
    html += "<div class='header'><h1>📦 " + String(WEB_TITLE) + "</h1>";
    html += "<div class='device-name'>" + deviceName + "</div></div>";
    
    html += "<div class='status-bar'>";
    html += "<div class='status-item'><div class='status-label'>Device Status</div>";
    html += "<div class='status-value' id='deviceStatus'>Loading...</div></div>";
    html += "<div class='status-item'><div class='status-label'>Wi-Fi</div>";
    html += "<div class='status-value' id='wifiStatus'>Loading...</div></div>";
    html += "<div class='status-item'><div class='status-label'>Signal</div>";
    html += "<div class='status-value' id='wifiSignal'>--</div></div>";
    html += "<div class='status-item'><div class='status-label'>Firebase</div>";
    html += "<div class='status-value' id='firebaseStatus'>Loading...</div></div></div>";
    
    html += "<div class='grid'>";
    
    // Environment card
    html += "<div class='card'><h2>🌡️ Environment</h2>";
    html += "<div class='sensor-row'><span class='sensor-label'>Temperature</span>";
    html += "<span class='sensor-value' id='temp'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Humidity</span>";
    html += "<span class='sensor-value' id='humidity'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Heat Index</span>";
    html += "<span class='sensor-value' id='heatIndex'>--</span></div>";
    html += "<div id='tempAlert'></div></div>";
    
    // Orientation card
    html += "<div class='card'><h2>📐 Orientation</h2>";
    html += "<div class='sensor-row'><span class='sensor-label'>Position</span>";
    html += "<span class='sensor-value' id='orientation'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Accel X</span>";
    html += "<span class='sensor-value' id='accelX'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Accel Y</span>";
    html += "<span class='sensor-value' id='accelY'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Accel Z</span>";
    html += "<span class='sensor-value' id='accelZ'>--</span></div>";
    html += "<div id='orientationAlert'></div></div>";
    
    // Motion card
    html += "<div class='card'><h2>🔄 Motion & Vibration</h2>";
    html += "<div class='sensor-row'><span class='sensor-label'>Gyro X</span>";
    html += "<span class='sensor-value' id='gyroX'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Gyro Y</span>";
    html += "<span class='sensor-value' id='gyroY'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Gyro Z</span>";
    html += "<span class='sensor-value' id='gyroZ'>--</span></div>";
    html += "<div class='sensor-row'><span class='sensor-label'>Vibration</span>";
    html += "<span class='sensor-value' id='vibration'>--</span></div>";
    html += "<div id='vibrationAlert'></div></div></div>";
    
    html += "<div class='footer'>Last Updated: <span id='lastUpdate'>--</span> | ";
    html += "Auto-refresh every " + String(WEB_REFRESH_MS / 1000) + " seconds</div></div>";
    
    // JavaScript
    html += "<script>";
    html += "function updateDashboard(){";
    html += "fetch('/api/sensors').then(r=>r.json()).then(data=>{";
    html += "document.getElementById('temp').textContent=data.temperature.toFixed(1)+'°C';";
    html += "document.getElementById('humidity').textContent=data.humidity.toFixed(1)+'%';";
    html += "document.getElementById('heatIndex').textContent=data.heatIndex.toFixed(1)+'°C';";
    html += "document.getElementById('orientation').textContent=data.orientation;";
    html += "document.getElementById('accelX').textContent=data.accelX.toFixed(2)+' m/s²';";
    html += "document.getElementById('accelY').textContent=data.accelY.toFixed(2)+' m/s²';";
    html += "document.getElementById('accelZ').textContent=data.accelZ.toFixed(2)+' m/s²';";
    html += "document.getElementById('gyroX').textContent=data.gyroX.toFixed(2)+' rad/s';";
    html += "document.getElementById('gyroY').textContent=data.gyroY.toFixed(2)+' rad/s';";
    html += "document.getElementById('gyroZ').textContent=data.gyroZ.toFixed(2)+' rad/s';";
    html += "document.getElementById('vibration').textContent=data.vibration?'Detected ⚠️':'Normal ✓';";
    
    // Alerts
    html += "const tempAlert=document.getElementById('tempAlert');";
    html += "if(data.tempAlert){tempAlert.innerHTML=\"<div class='alert danger'><div class='alert-text'>⚠️ Temperature Alert!</div></div>\";}else{tempAlert.innerHTML='';}";
    
    html += "const orientationAlert=document.getElementById('orientationAlert');";
    html += "if(data.orientation.includes('Upside Down')||data.orientation.includes('Free Fall')){";
    html += "orientationAlert.innerHTML=\"<div class='alert danger'><div class='alert-text'>⚠️ Abnormal Orientation!</div></div>\";}else{orientationAlert.innerHTML='';}";
    
    html += "const vibrationAlert=document.getElementById('vibrationAlert');";
    html += "if(data.vibration){vibrationAlert.innerHTML=\"<div class='alert'><div class='alert-text'>⚠️ High Vibration!</div></div>\";}else{vibrationAlert.innerHTML='';}";
    html += "}).catch(err=>console.error('Sensor fetch error:',err));";
    
    html += "fetch('/api/status').then(r=>r.json()).then(data=>{";
    html += "document.getElementById('deviceStatus').textContent=data.status;";
    html += "document.getElementById('wifiStatus').textContent=data.wifiSSID;";
    html += "document.getElementById('wifiSignal').textContent=data.wifiSignal+'%';";
    html += "const firebaseStatus=document.getElementById('firebaseStatus');";
    html += "firebaseStatus.textContent=data.firebaseConnected?'Connected ✓':'Disconnected ✗';";
    html += "firebaseStatus.className=data.firebaseConnected?'status-value connected':'status-value disconnected';";
    html += "}).catch(err=>console.error('Status fetch error:',err));";
    
    html += "const now=new Date();";
    html += "document.getElementById('lastUpdate').textContent=now.toLocaleTimeString();";
    html += "}";
    html += "updateDashboard();";
    html += "setInterval(updateDashboard," + String(WEB_REFRESH_MS) + ");";
    html += "</script></body></html>";
    
    return html;
}

String WebServerManager::generateSensorJSON() {
    String json = "{";
    
    // DHT11 Data
    if (dht && dht->isValid()) {
        json += "\"temperature\":" + String(dht->getTemperature(), 1) + ",";
        json += "\"humidity\":" + String(dht->getHumidity(), 1) + ",";
        json += "\"heatIndex\":" + String(dht->getHeatIndex(), 1) + ",";
        json += "\"tempAlert\":" + String(dht->isTemperatureAlert() ? "true" : "false") + ",";
    } else {
        json += "\"temperature\":0,\"humidity\":0,\"heatIndex\":0,\"tempAlert\":false,";
    }
    
    // MPU6050 Data
    if (mpu && mpu->isConnected()) {
        json += "\"accelX\":" + String(mpu->getAccelX(), 2) + ",";
        json += "\"accelY\":" + String(mpu->getAccelY(), 2) + ",";
        json += "\"accelZ\":" + String(mpu->getAccelZ(), 2) + ",";
        json += "\"gyroX\":" + String(mpu->getGyroX(), 2) + ",";
        json += "\"gyroY\":" + String(mpu->getGyroY(), 2) + ",";
        json += "\"gyroZ\":" + String(mpu->getGyroZ(), 2) + ",";
        json += "\"orientation\":\"" + mpu->detectOrientation() + "\",";
        json += "\"vibration\":" + String(mpu->detectVibration() ? "true" : "false");
    } else {
        json += "\"accelX\":0,\"accelY\":0,\"accelZ\":0,";
        json += "\"gyroX\":0,\"gyroY\":0,\"gyroZ\":0,";
        json += "\"orientation\":\"Sensor Error\",\"vibration\":false";
    }
    
    json += "}";
    return json;
}

String WebServerManager::generateStatusJSON() {
    String json = "{";
    json += "\"status\":\"" + deviceStatus + "\",";
    json += "\"wifiSSID\":\"" + wifiSSID + "\",";
    json += "\"wifiRSSI\":" + String(wifiRSSI) + ",";
    json += "\"wifiSignal\":" + String(rssiToPercent(wifiRSSI)) + ",";
    json += "\"firebaseConnected\":" + String(firebaseConnected ? "true" : "false") + ",";
    json += "\"uptime\":" + String(millis() / 1000);
    json += "}";
    return json;
}

void WebServerManager::handleNotFound(AsyncWebServerRequest* request) {
    String message = "404: Not Found\n\n";
    message += "URI: " + request->url() + "\n";
    message += "Method: " + String((request->method() == HTTP_GET) ? "GET" : "POST") + "\n";
    request->send(404, "text/plain", message);
}

void WebServerManager::setDeviceStatus(const String& status) {
    deviceStatus = status;
}

void WebServerManager::setWiFiInfo(const String& ssid, int rssi) {
    wifiSSID = ssid;
    wifiRSSI = rssi;
}

void WebServerManager::setFirebaseStatus(bool connected) {
    firebaseConnected = connected;
}

int WebServerManager::rssiToPercent(int rssi) {
    if (rssi >= -50) return 100;
    if (rssi <= -100) return 0;
    return 2 * (rssi + 100);
}