# TRACEON - Hardware Setup & Configuration Guide

## Overview
TRACEON is a smart parcel monitoring system built on ESP32-WROOM that tracks temperature, humidity, vibration, and orientation of logistics packages in real-time. This guide covers initial hardware setup and WiFi configuration.

---

## 1. Hardware Components

### Main Controller
- **ESP32-WROOM** - 4MB Flash, 370KB RAM, Dual-core processor (you can use any other esp32 family microcontroller)

### Sensors
- **DHT11** - Temperature and Humidity sensor
- **MPU6050** - 6-axis accelerometer & gyroscope (I2C)

### I/O
- **Status LED** - GPIO2 (Blue LED indicator)
- **Reset Button** - GPIO0 (BOOT button for WiFi reset)
- **Power** - Micro-USB (5V, 500mA minimum)

### Pin Configuration

| Component | GPIO | Protocol | Notes |
|-----------|------|----------|-------|
| DHT11 | 4 | Digital | Temperature/Humidity |
| MPU6050 SDA | 21 | I2C | Accelerometer/Gyroscope |
| MPU6050 SCL | 22 | I2C | Data Clock |
| Status LED | 2 | Digital | LED Indicator |
| Reset Button | 0 | Input | Bootloader button |

### I2C Configuration
- **Frequency**: 400kHz
- **MPU6050 Address**: 0x68 (default)
- **Pull-up Resistors**: Required (usually onboard)

---

## 2. Initial Power-On & LED Status

### What to Expect on First Boot

1. **Solid Blue LED** (2 seconds) → System initializing
2. **Blinking Blue LED** (10 pulses) → WiFiManager entering configuration mode
3. **LED Off** → Waiting for WiFi configuration
4. **Solid Blue LED** → Connected to WiFi and ready

**Take a screenshot of the LED status patterns for visual reference during initial setup.**

---

## 3. WiFi Configuration Methods

### Method 1: Direct WiFi Access Point (Recommended)

This is the easiest method when no saved WiFi is available or previously configured access point is not reachable.

#### Steps:

1. **Power on the device** and wait for the blinking LED pattern (approximately 3 seconds)

2. **On your mobile device or computer, open WiFi settings and look for a new SSID named:**
   ```
   TRACEON_XXXXXX_Direct
   ```
   Where `XXXXXX` is the last 6 characters of the device's MAC address.

3. **Connect to this WiFi with password:**
   ```
   traceon_setup
   ```

4. **Open a web browser and navigate to:**
   ```
   http://192.168.4.1
   ```
   
   **Capture a screenshot of this initial WiFi configuration portal page.**

5. **On the portal page, select your home/office WiFi network:**
   - Look for available SSID list
   - Select your WiFi network name
   - Enter the WiFi password
   - Click "Save"

6. **The device will:**
   - Attempt to connect to your WiFi
   - Display connection status (LED pattern change)
   - Store credentials for automatic reconnection

#### Direct Access Point Benefits
- **No WiFi router needed** - Works anywhere
- **Simultaneous access** - Device can be both connected to your WiFi AND broadcast its own access point
- **Fallback option** - Always available if main WiFi fails

---

### Method 2: WiFiManager Captive Portal (Full Network Setup)

If the direct AP method isn't accessible, the device still provides a captive portal after 3 minutes if WiFi connection fails.

#### Steps:

1. **Power on the device** and wait for blinking LED

2. **Connect to the AP named:**
   ```
   TRACEON_XXXXXX
   ```
   Password: `traceon_setup`

3. **Captive portal should automatically open** on your device
   - If not, manually navigate to: `http://192.168.4.1`

4. **Select your WiFi network and enter credentials**

5. **Configuration timeout** - Portal closes after 3 minutes if no action

---

### Method 3: Resetting WiFi Settings

**To reset all saved WiFi credentials and force reconfiguration:**

1. **Press and hold the BOOT button (GPIO0)** for **5 seconds**
2. **Observe LED blinking pattern** (20 rapid blinks)
3. **Device restarts** - WiFiManager automatically enters configuration mode
4. **Serial output will show:**
   ```
   [WiFi] 🔄 RESET - Clearing WiFi settings...
   [WiFi] ✅ Settings cleared! Restarting...
   ```

**Document this reset procedure with a screenshot of the LED blink pattern.**

---

## 4. Accessing the Dashboard After WiFi Connection

Once successfully connected to WiFi, the device hosts an interactive web dashboard accessible through three methods:

### Access Method 1: Using Device IP Address (Fastest)

1. **Check device's IP address** from:
   - **Serial Monitor** (115200 baud) - shows IP after connection
   - **Router admin panel** - look for TRACEON device

2. **On any device connected to the same WiFi network, open browser:**
   ```
   http://<device-ip>
   ```
   Example: `http://192.168.1.45`

3. **Dashboard loads immediately** - Live sensor data appears

### Access Method 2: Using mDNS Hostname (Universal)

1. **Works on devices with mDNS support** (most modern phones/computers)

2. **Open browser and navigate to:**
   ```
   http://traceon.local
   ```

3. **Dashboard page loads** automatically

**This is the recommended method as it works even if IP address changes.**

### Access Method 3: Direct Access Point (No Router Needed)

1. **Connect mobile device to WiFi network:**
   ```
   TRACEON_XXXXXX_Direct
   ```
   Password: `traceon_setup`

2. **Open browser and navigate to:**
   ```
   http://192.168.4.1
   ```

3. **Dashboard displays** - View real-time data without main WiFi connection

---

## 5. Dashboard Interface Overview

### Top Status Bar

| Indicator | Meaning |
|-----------|---------|
| **Device Status** | Online / Monitoring / Sensor Error |
| **WiFi SSID** | Connected network name |
| **WiFi Signal** | 0-100% signal strength |
| **Firebase** | Connected ✓ or Disconnected ✗ |

### Sensor Cards

1. **Environment Card** 🌡️
   - Temperature (°C)
   - Humidity (%)
   - Heat Index
   - Alerts: Temperature threshold violations

2. **Orientation Card** 📐
   - Current Position (Normal/Tilted/Upside Down/Free Fall)
   - Acceleration X, Y, Z axes (m/s²)
   - Alerts: Abnormal orientation warnings

3. **Motion & Vibration Card** 🔄
   - Gyro readings X, Y, Z (rad/s)
   - Vibration status (Detected or Normal)
   - Alerts: Excessive vibration detection

### Auto-Refresh
- **Updates every 3 seconds** automatically
- **Last Updated timestamp** shown at bottom
- **No manual refresh needed** - live data streaming

**Capture screenshots of each sensor card displaying real data for documentation.**

---

## 6. Serial Monitor Connection (Debugging)

### Setup Serial Communication

1. **Install CH340 driver** (USB-to-Serial chip on ESP32 dev boards)
   - Windows: Download from [WCH](http://wch.cn/)
   - Linux/Mac: Usually auto-detected

2. **Connect ESP32 to computer via Micro-USB**

3. **In PlatformIO or Arduino IDE:**
   - Select COM port (Windows) or /dev/ttyUSB0 (Linux)
   - Baud rate: **115200**

4. **Open Serial Monitor**

### Expected Output on Startup

```
=====================================
   TRACEON PARCEL MONITORING v1.3
=====================================
Chip Model: ESP32
CPU Frequency: 240 MHz
Flash Size: 4 MB
Free Heap: 270 KB
=====================================

[WiFi] Starting WiFiManager...
[WiFi] AP Name: TRACEON_ABC123
[WiFi] AP Password: traceon_setup

[WiFi] ⚙️  CONFIGURATION MODE
=====================================
Connect to AP: TRACEON_ABC123
Password: traceon_setup
Go to: http://192.168.4.1
=====================================

[WiFi] ✅ Connected!
[WiFi] SSID: MyHomeWiFi
[WiFi] IP: 192.168.1.45
[WiFi] RSSI: -55 dBm
[WiFi] Signal: 90%

[NTP] Syncing time with server... ✅ Success
[mDNS] Starting... ✅ Success
[mDNS] Access via: http://traceon.local

[AP] Starting simultaneous Access Point... ✅ Success
[AP] Direct Access SSID: TRACEON_ABC123_Direct
[AP] Direct Access Password: traceon_setup
[AP] Direct Access IP: http://192.168.4.1

=====================================
   ✅ SYSTEM READY
=====================================
📡 NETWORK ACCESS METHODS:
-------------------------------------
1️⃣  Router/Hotspot: http://192.168.1.45
2️⃣  mDNS Name: http://traceon.local
3️⃣  Direct WiFi: 'TRACEON_ABC123_Direct'
    Password: traceon_setup
    Then: http://192.168.4.1
-------------------------------------
🔥 Firebase: /SmartParcels/TRACEON_ABC123
=====================================
```

---

## 7. Troubleshooting

### LED Not Blinking on Power

- **Check USB cable** - Ensure proper connection and 5V power supply
- **Verify power delivery** - Use power adapter with minimum 500mA output
- **Try different USB port** - Port may be defective

**Attach LED connection diagram with power supply specifications.**

### Cannot Find WiFi Network

- **Wait 3-5 seconds after power** - LED startup sequences take time
- **Check device name** - Look for TRACEON_XXXXXX specifically
- **WiFi is 2.4GHz only** - Not compatible with 5GHz networks
- **Check WiFi range** - Move device closer to router

### Cannot Connect to Configuration Portal

- **Confirm WiFi password** - Case-sensitive: `traceon_setup`
- **Check IP address** - Ensure entering `192.168.4.1` correctly
- **Try different browser** - Chrome/Firefox recommended
- **Check WiFi connection status** - Ensure still connected to TRACEON AP

**Provide visual guide with screenshots of each step.**

### Dashboard Not Loading

- **Verify WiFi connection** - Check status LED is solid (not blinking)
- **Use serial monitor** - Find actual IP address if unsure
- **Try mDNS address** - `http://traceon.local` if IP fails
- **Restart device** - Unplug for 5 seconds, reconnect power
- **Check firewall** - Ensure port 80 not blocked on network

### Sensor Data Showing "0" or "--"

- **DHT11 not connected** - Check GPIO4 wire connection
- **MPU6050 not connected** - Check I2C (GPIO 21/22) connections
- **Address conflict** - Verify I2C address is 0x68 for MPU6050
- **Pull-up resistors** - I2C usually has onboard pull-ups, verify presence

**Include connection diagrams for both sensors with pin labels clearly marked.**

---

## 8. Network Access Summary

### Three Access Methods Available

| Method | Access Point | URL | Uses |
|--------|-------------|-----|------|
| **Main Network** | Connected WiFi | `http://<IP>` or `http://traceon.local` | Primary usage |
| **Direct AP** | `TRACEON_XXXXXX_Direct` | `http://192.168.4.1` | No router needed |
| **Fallback** | `TRACEON_XXXXXX` (if fails) | `http://192.168.4.1` | Emergency config |

### Device Always Broadcasting
- Main WiFi connection: Active
- Direct Access Point: Always active simultaneously
- **Never loses connectivity** - Always reachable via direct AP

---

## 9. Advanced Configuration

### Changing WiFi Credentials
1. Press BOOT button for 5 seconds (full reset)
2. Device restarts and enters configuration mode
3. Reconfigure with new WiFi details
4. Old credentials erased and replaced

### Customizing Thresholds
Thresholds can be modified via Firebase or `config.h`:
- Temperature: Default 5-40°C
- Humidity: Default 20-80%
- Vibration: Default 15.0 m/s²

See `config.h` for details.

### Serial Output Control
Debug logs can be disabled in `config.h`:
```cpp
#define ENABLE_DEBUG_LOGS 0  // Set to 0 to disable
```

---

## 10. First-Time Checklist

- [ ] Verify all hardware connections (DHT11, MPU6050, LED, Button)
- [ ] Connect USB power cable
- [ ] Observe LED startup sequence
- [ ] Find TRACEON WiFi network on phone/computer
- [ ] Connect with password `traceon_setup`
- [ ] Navigate to `http://192.168.4.1`
- [ ] Select home WiFi network and enter password
- [ ] Wait for LED to turn solid (connection successful)
- [ ] On phone, open browser to `http://traceon.local`
- [ ] Verify dashboard loads with sensor data
- [ ] Check serial monitor for connection details
- [ ] Test reset button (BOOT) - observe LED patterns
- [ ] Verify Firebase shows new device entry

---

## 11. Support & Resources

### Serial Terminal Commands
Baud rate: **115200**

### Useful Information (From Serial)
- Device Name: `TRACEON_XXXXXX`
- MAC Address: Shown at startup
- Firmware Version: `1.3`
- WiFi Signal Strength: Percentage and dBm
- Firebase Base Path: `/SmartParcels/TRACEON_XXXXXX`

### Component Datasheets
- **ESP32**: Espressif IDF Documentation
- **DHT11**: Digital humidity & temperature sensor
- **MPU6050**: 6-axis motion sensor, I2C interface

---

## Final Notes

- **WiFi credentials stored in flash** - Survive power cycles
- **Reset button always available** - 5-second press clears WiFi
- **Dual AP access** - Never without connectivity options
- **Auto-reconnect enabled** - Automatically reconnects if WiFi drops
- **NTP time sync** - Automatic timezone adjustment
- **Firebase integration** - All data uploaded and timestamped

**Attach final deployment photos of the assembled unit with all components properly connected and functioning.**

---

*Last Updated: November 2024*
*TRACEON Firmware v1.3*
