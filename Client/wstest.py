from websocket import create_connection
from datetime import datetime

#ws = create_connection("ocpp-server-mungyoyo.c9users.io:8000/ocpp/2")
ws = create_connection("ws://localhost/ocpp/CP001")

##print("Sending Authorize.req ...")
##ws.send('[2, "BQMYei0kseAoZ2aij7mbTs37UNGCFLhv",'+
##        '"Authorize",{"idTag":"D86F20CE"}]')
##print("Recieved Authorize.con ...\n"+ws.recv())

# print("Sending StartTransaction.req ...")
# time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC",'+
#         '"StartTransaction", {"connectorId": 0,'+
#         '"meterStart": 0, "idTag": "D86F20CE",'+
#         '"timestamp": "Sun Jan 14 2019 21:22:55'+
#         'GMT+0700 (Local Standard Time)"}]')
# print("Recieved StartTransaction.req ...\n"+ws.recv())

print("Sending StopTransaction.req ...")
time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "StopTransaction",'+
           '{"transactionId": "6", "timestamp": "Sun Jan 15 2019 06:22:55'+
            'GMT+0700 (Local Standard Time)",'+
            '"idTag": "D86F20CE", "meterStop":11.2}]')
print("Recieved StartTransaction.req ...\n"+ws.recv())
