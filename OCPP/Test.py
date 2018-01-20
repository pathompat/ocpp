from websocket import create_connection
from datetime import datetime
import Adafruit_BBIO.UART as UART
import Adafruit_BBIO.GPIO as GPIO
import Adafruit_BBIO.ADC as ADC
from time import sleep
import serial

UART.setup("UART1")

analogpin = 'P9_33'
ADC.setup()
ButtonStrat = 'P9_12'
ButtonStop = 'P9_23'
GPIO.setup(ButtonStrat,GPIO.IN)
GPIO.setup(ButtonStop,GPIO.IN)

ws = create_connection("ws://192.168.1.39/ocpp/1")
serial = serial.Serial(port = "/dev/ttyO1", baudrate=115200)
serial.open()
def auten():
   tag = ''
   print ('Send...')
   for i in range(0, 8):
      data = serial.read()
      tag = tag + data
      if i == 7:
         print tag
         ws.send('[2, "BQMYei0kseAoZ2aij7mbTs37UNGCFLhv", "Authorize", {"idTag":"'+ tag + '"}]')
         print ('Reciving...')
         result = ws.recv()
         print("Received : ", result)
         print ('Pless button strat')
         tag = ''
         i = 0
def StartTransaction():
   if(GPIO.input(ButtonStrat)):
        print ('Charging...')
        time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ws.send('[2, "ZeERlwkKOEdm9qaCnTUpDXI95bxr1ot3", "StatusNotification", {"timestamp": "'+time_now+'", "status": "Charging", "connectorId": 0, "errorCode": "NoEr$
        result = ws.recv()
        print("Received : ", result)
        ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC", "StartTransaction", {"connectorId": 0, "meterStart": 0, "idTag": "D86F20CE", "timestamp": "'+ time_now+'"}]')
        result = ws.recv()
        print("Received : ", result)
        val1 = 0
        val = ADC.read(analogpin)
        voltage = val * 1.8
        current = voltage / 1000
        power = voltage * current
        val1 = str(power*1000)
        ws.send('[2, "uIDHeJPq6QESJEKY2Tu1qzimdxgfBQNW", "MeterValues", {"transactionId": "1", "connectorId": 0, "meterValue": [{"sampledValue": [{"value": "'+ val1 +'$
        result = ws.recv()
        print("Received : ", result)
def StopTransaction():
   if(GPIO.input(ButtonStop)):
              print ('Stop')
              ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "StopTransaction", {"transactionId": "1", "timestamp": "'+ time_now +'", "idTag": "D86F20CE", "meterStop$
              result = ws.recv()
              print("Received : ",  result)
              print ('\n')
while True:
   auten()
      while True:
         StartTransaction()
            while True:
               StopTransaction()
               auten()
               break

GPIO.cleanup()
serial.close()
ws.close()
                      
