#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <ESP32Servo.h>
#include "Audio.h"
#include <WiFiManager.h> 

// --- الأجهزة والتعريفات ---
WebSocketsServer webSocket = WebSocketsServer(81);
Audio audio;

// --- بنز الـ I2S (MAX98357A) ---
#define I2S_BCLK      26
#define I2S_LRC       25
#define I2S_DOUT      22

// --- بنز الـ TFT SPI ---
#define TFT_CS 15
#define TFT_DC 2
#define TFT_RST 4
#define TFT_BL 5
Adafruit_GC9A01A tft(TFT_CS, TFT_DC, TFT_RST);

// --- بنز السيرفو ---
Servo leftArm, rightArm;
#define PIN_ARM_L 12
#define PIN_ARM_R 13

// --- متغيرات الحالة ---
char currentMood = 'i';
unsigned long lastAnimUpdate = 0;
bool lookRight = true;

// --- وظائف الحركة والرسم ---
void moveArms(int l, int r) {
  leftArm.write(l);
  rightArm.write(r);
}

void drawIdleEyes() {
  tft.fillCircle(80, 120, 25, GC9A01A_WHITE);
  tft.fillCircle(160, 120, 25, GC9A01A_WHITE);
}

void executeMood(char cmd) {
  currentMood = cmd;
  tft.fillScreen(GC9A01A_BLACK);
  switch (cmd) {
    case 'h': 
      tft.fillCircle(80, 110, 25, GC9A01A_GREEN); 
      tft.fillCircle(160, 110, 25, GC9A01A_GREEN); 
      moveArms(30, 150); 
      break;
    case 'k': 
      tft.fillCircle(100, 100, 30, GC9A01A_RED); 
      tft.fillCircle(140, 100, 30, GC9A01A_RED); 
      tft.fillTriangle(72, 115, 168, 115, 120, 180, GC9A01A_RED); 
      moveArms(80, 100); 
      break;
    case 'a': 
      tft.fillCircle(80, 120, 25, GC9A01A_RED); 
      tft.fillCircle(160, 120, 25, GC9A01A_RED); 
      moveArms(140, 40); 
      break;
    case 't': 
      moveArms(60, 120); 
      break;
    case 'i': 
    default: 
      drawIdleEyes(); 
      moveArms(170, 10); 
      break;
  }
}

// --- التعامل مع أحداث الـ WebSocket ---
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_TEXT:
      executeMood((char)payload[0]);
      Serial.printf("[%u] Command: %c\n", num, (char)payload[0]);
      break;
      
    case WStype_BIN:
      // استخدام playChunk لاستقبال الداتا وايرلس وتشغيلها
      // لو طلعت Error، غيرها لـ playRAW
      audio.playChunk(payload, length);
      Serial.printf("[%u] Received Audio Binary (%u bytes)\n", num, length);
      break;
      
    case WStype_CONNECTED:
      Serial.printf("[%u] Connected!\n", num);
      break;
      
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);

  // 1. تشغيل الشاشة
  tft.begin();
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);
  tft.fillScreen(GC9A01A_BLACK);
  tft.setTextColor(GC9A01A_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 100);
  tft.println("Lumo is Booting...");

  // 2. إعداد WiFiManager
  WiFiManager wm;
  
  // wm.resetSettings(); // تفعيله يمسح الواي فاي المتسيف

  if (!wm.autoConnect("Lumo-Config-Portal")) {
      Serial.println("Failed to connect");
      ESP.restart();
  }

  // نجاح التوصيل
  tft.fillScreen(GC9A01A_BLACK);
  tft.setTextColor(GC9A01A_GREEN);
  tft.setCursor(20, 100);
  tft.println("WiFi Connected!");
  tft.setCursor(20, 130);
  tft.setTextColor(GC9A01A_WHITE);
  tft.println(WiFi.localIP());
  delay(3000); 

  // 3. إعداد الصوت (I2S)
  audio.setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
  audio.setVolume(21); 

  // 4. إعداد الـ WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  // 5. إعداد السيرفو
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  leftArm.attach(PIN_ARM_L, 500, 2400);
  rightArm.attach(PIN_ARM_R, 500, 2400);
  
  executeMood('i');
}

void loop() {
  webSocket.loop();
  audio.loop(); // ضروري جداً لتشغيل بافر الصوت
  
  // أنيميشن التفكير
  if (currentMood == 't' && millis() - lastAnimUpdate > 500) {
    lastAnimUpdate = millis();
    tft.fillRect(40, 80, 160, 60, GC9A01A_BLACK); 
    if (lookRight) { 
      tft.fillCircle(100, 100, 20, 0xFFE0); 
      tft.fillCircle(180, 100, 20, 0xFFE0); 
    } else { 
      tft.fillCircle(60, 100, 20, 0xFFE0); 
      tft.fillCircle(140, 100, 20, 0xFFE0); 
    }
    lookRight = !lookRight;
  }
}