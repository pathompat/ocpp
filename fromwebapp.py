from websocket import create_connection
from datetime import datetime
import time

#ws = create_connection("ocpp-server-mungyoyo.c9users.io:8000/ocpp/2")
ws = create_connection("ws://localhost/ocpp/webapp")

#while True:
ws.send('{"connectorid":0,'+
        '"cpid":"CP001",'+
        '"expiryDate":"Sun Jan 14 2019 21:22:55 GMT+0700 (Local Standard Time)",'+
        '"idTag":"79DEF69"}')
#time.sleep(5)