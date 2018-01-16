from websocket import create_connection
from datetime import datetime

#ws = create_connection("ocpp-server-mungyoyo.c9users.io:8000/ocpp/2")
ws = create_connection("ws://localhost/ocpp/CP001")

print("Sending Authorize.req ...")
ws.send('[2, "BQMYei0kseAoZ2aij7mbTs37UNGCFLhv",'+
        '"Authorize",{"idTag":"D86F20CE"}]')
print("Recieved Authorize.con ...\n"+ws.recv())

##print("Sending StartTransaction.req ...")
##time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
##ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC",'+
##        '"StartTransaction", {"connectorId": 0,'+
##        '"meterStart": 0, "idTag": "D86F20CE",'+
##        '"timestamp": "'+ time_now +'"}]')
##print("Recieved StartTransaction.req ...\n"+ws.recv())
