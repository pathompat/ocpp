from websocket import create_connection
from datetime import datetime
import time

#ws = create_connection("ocpp-server-mungyoyo.c9users.io:8000/ocpp/2")
ws = create_connection("ws://192.168.73.85/ocpp/1")

# print("Sending Authorize.req ...")
# ws.send('[2, "BQMYei0kseAoZ2aij7mbTs37UNGCFLhv",'+
#        '"Authorize",{"idTag":"D86F20CE"}]')
# print("Recieved Authorize.con ...\n"+ws.recv())

# print("Sending StartTransaction.req ...")
# time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC",'+
#         '"StartTransaction", {"connectorId": 0,'+
#         '"meterStart": 0, "idTag": "D86F20CE",'+
#         '"timestamp": "Sun Jan 14 2019 21:22:55'+
#         'GMT+0700 (Local Standard Time)"}]')
# print("Recieved StartTransaction.req ...\n"+ws.recv())

# print("Sending StopTransaction.req ...")
# time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "StopTransaction",'+
#            '{"transactionId": "6", "timestamp": "Sun Jan 15 2019 06:22:55'+
#             'GMT+0700 (Local Standard Time)",'+
#             '"idTag": "D86F20CE", "meterStop":11.2}]')
# print("Recieved StartTransaction.req ...\n"+ws.recv())

#while True:
print(ws)
print("Sending Heartbeat.req ...")
ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "Heartbeat",{}]')
#print("Recieved Piggybacking data ...\n"+ws.recv())
print("Recieved Heartbeat.req ...\n"+ws.recv())
#    time.sleep(1)

# print("Sending MeterValues.req ...")
# ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "MeterValues",'+
#         '{"connectorId": 0, "meterValue": {"sampledValue": {"value": 1.3566, "unit": "kWh"}}}]')
# print("Recieved MeterValues.req ...\n"+ws.recv())

# print("Sending StatusNotification.req ...")
# ws.send('[2, "ZeERlwkKOEdm9qaCnTUpDXI95bxr1ot3", "StatusNotification", {"status": "Available", "connectorId": 0, "errorCode": "NoError"}]')
# print("Recieved StatusNotification.req ...\n"+ws.recv())

# print("Sending BootNotification.req ...")
# ws.send('[2, "uSf1t12mu6qNsE11NURHJIFXw3GdJDLJ", "BootNotification", '+
#         '{"meterSerialNumber": "SN1234567", "chargePointModel": "KMUTNB", "chargePointVendor": "KMUTNB",'+ 
#         '"firmwareVersion": "1.0", "chargePointSerialNumber": "0102030405"}]')
# print("Recieved BootNotification.req ...\n"+ws.recv())