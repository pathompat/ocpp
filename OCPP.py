

def bootNotification():
	global ws
	#ws = create_connection("ws://192.168.1.8:9001/")
	#ws = create_connection("ws://echo.websocket.org/")
	ws = create_connection("ws://chargedi.com/EV/Srv/JSON/1.6/KMUTNB/")
	#ws = create_connection("ws://10.110.15.246/ocppj/KTD_000001/")
	time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	print("Sending 'BootNotification'...")

	########### BootNotification  #######################
	ws.send('[2, "uSf1t12mu6qNsE11NURHJIFXw3GdJDLJ", "BootNotification", {"meterSerialNumber": "SN1234567", "chargePointModel": "KMUTNB", "chargePointVendor": "KMUTNB", "firmwareVersion": "1.0", "chargePointSerialNumber": "0102030405"}]')
	#ws.send('[3, "BQMYei0kseAoZ2aij7mbTs37UNGCFLh", {"status": "Accepted", "currentTime": "2017-05-31 10.25.36", "interval": 1200}]')
		
	print("Sent")
	#print "Receiving..."
	result = ws.recv()
	#print "Received '%s'" % result
	


def check_card(card_id):
	print(card_id)
	#ws = create_connection("ws://192.168.1.8:9001/")
	#ws = create_connection("ws://echo.websocket.org/")
	
	authorize_message = card_id
	
	# 049B009A631E84
	########### Authorize  #######################
	#ws.send('[2, "BQMYei0kseAoZ2aij7mbTs37UNGCFLhv", "Authorize", {"idTag":"'+ card_id + '"}]')
	ws.send('[2, "ljVpM6AZOI5TU0m1WH3OBAzWcm57Uodp", "Authorize", {"idTag": "'+ card_id + '"}]')
	print("Sent")
	#print "Receiving..."
	result = ws.recv()
	#print "Received '%s'" % result

def statusNotification(status):
	#global datetime
	#ws = create_connection("ws://192.168.1.8:9001/")
	#ws = create_connection("ws://echo.websocket.org/")
	time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	#print 
	########### StatusNotification  start#######################
	#ws.send('[2, "ZeERlwkKOEdm9qaCnTUpDXI95bxr1ot3", "StatusNotification", {"timestamp": "'+time_now+'", "status": "'+status+'", "connectorId": 0, "errorCode": "NoError"}]')
	ws.send('[2, "ZeERlwkKOEdm9qaCnTUpDXI95bxr1ot3", "StatusNotification", {"timestamp": "'+time_now+'", "status": "'+status+'", "connectorId": 0, "errorCode": "NoError"}]')
	
	print("Sent")
	print("Receiving...")
	result = ws.recv()
	print("Received '%s'" % result)

def startTransaction(card_id):
	global transaction
	time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	
	########### StartTransaction #######################
	#ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC", "StartTransaction", {"connectorId": 0, "meterStart": 0, "idTag": "049B009A631E84", "timestamp": "'+ time_now+'"}]')
	ws.send('[2, "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC", "StartTransaction", {"connectorId": 0, "meterStart": 0, "idTag": "'+card_id+'", "timestamp": "'+ time_now+'"}]')
	print("Sent")
	print("Receiving...")
	result = ws.recv()
	print("Received '%s'" % result)
	decode = json.loads(result)
	
	if decode[1] == "XHgRau8AcLOUezhYFvZWKMi83DeP1bvC":
		transaction = decode[2]['transactionId']
		print(transaction)
	else:
		print('Out of Array')
	
def stopTransaction(card_id,trans,energy1):
	
	time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	
	########### StopTransaction #######################
	#[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "StopTransaction", {"transactionId": "'+transaction +'", "timestamp": "2017-07-04 08:34:30", "reason": "Local", "idTag": "049B009A631E84", "meterStop": 10579.61, "transactionData": [{"sampledValue": [{"context": "Transaction.End", "value": "10579.62", "unit": "kWh", "location": "Inlet", "measurand": "Energy.Active.Import.Register"}, {"phase": "L1", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "2.700056", "measurand": "Power.Active.Import"}, {"phase": "L2", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "2.751093", "measurand": "Power.Active.Import"}, {"phase": "L3", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "--", "measurand": "Power.Active.Import"}, {"phase": "L1", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "0.9588653", "measurand": "Power.Reactive.Import"}, {"phase": "L2", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "0.9591161", "measurand": "Power.Reactive.Import"}, {"phase": "L3", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "1.000569", "measurand": "Power.Reactive.Import"}, {"phase": "L1", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "12.85283", "measurand": "Current.Import"}, {"phase": "L2", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "12.90138", "measurand": "Current.Import"}, {"phase": "L3", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "13.29015", "measurand": "Current.Import"}, {"phase": "L1-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "222.8527", "measurand": "Voltage"}, {"phase": "L2-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "223.5946", "measurand": "Voltage"}, {"phase": "L3-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "224.1436", "measurand": "Voltage"}, {"phase": "L1-L2", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "386.0944", "measurand": "Voltage"}, {"phase": "L2-L3", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "387.4443", "measurand": "Voltage"}, {"phase": "L3-L1", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "387.9305", "measurand": "Voltage"}, {"phase": "L1", "context": "Transaction.End", "value": "0.9461274", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L2", "context": "Transaction.End", "value": "0.9474822", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L3", "context": "Transaction.End", "value": "0.9458111", "location": "Inlet", "measurand": "Power.Factor"}, {"context": "Transaction.End", "value": "50.03247", "unit": "Hz", "location": "Inlet", "measurand": "Frequency"}], "timestamp": "2017-07-04 08:34:30"}]}]
	ws.send('[2, "xkgU2inssohvi7b3Im2BTjxZGkMEJgYk", "StopTransaction", {"transactionId": "' + trans +'", "timestamp": "'+ time_now +'", "reason": "Local", "idTag": "'+card_id+'", "meterStop": '+energy1+', "transactionData": [{"sampledValue": [{"context": "Transaction.End", "value": "10579.62", "unit": "kWh", "location": "Inlet", "measurand": "Energy.Active.Import.Register"}, {"phase": "L1", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "2.700056", "measurand": "Power.Active.Import"}, {"phase": "L2", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "2.751093", "measurand": "Power.Active.Import"}, {"phase": "L3", "unit": "kW", "location": "Inlet", "context": "Transaction.End", "value": "--", "measurand": "Power.Active.Import"}, {"phase": "L1", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "0.9588653", "measurand": "Power.Reactive.Import"}, {"phase": "L2", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "0.9591161", "measurand": "Power.Reactive.Import"}, {"phase": "L3", "unit": "kvar", "location": "Inlet", "context": "Transaction.End", "value": "1.000569", "measurand": "Power.Reactive.Import"}, {"phase": "L1", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "12.85283", "measurand": "Current.Import"}, {"phase": "L2", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "12.90138", "measurand": "Current.Import"}, {"phase": "L3", "unit": "A", "location": "Inlet", "context": "Transaction.End", "value": "13.29015", "measurand": "Current.Import"}, {"phase": "L1-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "222.8527", "measurand": "Voltage"}, {"phase": "L2-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "223.5946", "measurand": "Voltage"}, {"phase": "L3-N", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "224.1436", "measurand": "Voltage"}, {"phase": "L1-L2", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "386.0944", "measurand": "Voltage"}, {"phase": "L2-L3", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "387.4443", "measurand": "Voltage"}, {"phase": "L3-L1", "unit": "V", "location": "Inlet", "context": "Transaction.End", "value": "387.9305", "measurand": "Voltage"}, {"phase": "L1", "context": "Transaction.End", "value": "0.9461274", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L2", "context": "Transaction.End", "value": "0.9474822", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L3", "context": "Transaction.End", "value": "0.9458111", "location": "Inlet", "measurand": "Power.Factor"}, {"context": "Transaction.End", "value": "50.03247", "unit": "Hz", "location": "Inlet", "measurand": "Frequency"}], "timestamp": "2017-07-04 08:34:30"}]}]')
	print("Sent")
	print("Receiving...")
	result = ws.recv()
	print("Received '%s'" % result)
	
def MeterValue(energy_value,current1,trans):
	
	time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	
	########### MeterValue #######################
	#[2, "uIDHeJPq6QESJEKY2Tu1qzimdxgfBQNW", "MeterValues", {"transactionId": "'+time_now+'", "connectorId": 0, "meterValue": [{"sampledValue": [{"context": "Sample.Periodic", "value": "'+ energy_value +'", "unit": "kWh", "location": "Inlet", "measurand": "Energy.Active.Import.Register"}, {"phase": "L1", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.51885", "measurand": "Power.Active.Import"}, {"phase": "L2", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.559022", "measurand": "Power.Active.Import"}, {"phase": "L3", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.654507", "measurand": "Power.Active.Import"}, {"phase": "L1", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3597944", "measurand": "Power.Reactive.Import"}, {"phase": "L2", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3046703", "measurand": "Power.Reactive.Import"}, {"phase": "L3", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3803998", "measurand": "Power.Reactive.Import"}, {"phase": "L1", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "'+current1+'", "measurand": "Current.Import"}, {"phase": "L2", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "28.91422", "measurand": "Current.Import"}, {"phase": "L3", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "29.26725", "measurand": "Current.Import"}, {"phase": "L1-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "222.4919", "measurand": "Voltage"}, {"phase": "L2-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "223.1888", "measurand": "Voltage"}, {"phase": "L3-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "223.9568", "measurand": "Voltage"}, {"phase": "L1-L2", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "385.4761", "measurand": "Voltage"}, {"phase": "L2-L3", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "386.9814", "measurand": "Voltage"}, {"phase": "L3-L1", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "387.4622", "measurand": "Voltage"}, {"phase": "L1", "context": "Sample.Periodic", "value": "0.9984422", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L2", "context": "Sample.Periodic", "value": "0.9989488", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L3", "context": "Sample.Periodic", "value": "0.998432", "location": "Inlet", "measurand": "Power.Factor"}, {"context": "Sample.Periodic", "value": "50.00403", "unit": "Hz", "location": "Inlet", "measurand": "Frequency"}], "timestamp": "'+time_now+'"}]}]
	ws.send('[2, "uIDHeJPq6QESJEKY2Tu1qzimdxgfBQNW", "MeterValues", {"transactionId": "'+trans+'", "connectorId": 0, "meterValue": [{"sampledValue": [{"context": "Sample.Periodic", "value": "'+ energy_value +'", "unit": "kWh", "location": "Inlet", "measurand": "Energy.Active.Import.Register"}, {"phase": "L1", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.51885", "measurand": "Power.Active.Import"}, {"phase": "L2", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.559022", "measurand": "Power.Active.Import"}, {"phase": "L3", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.654507", "measurand": "Power.Active.Import"}, {"phase": "L1", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3597944", "measurand": "Power.Reactive.Import"}, {"phase": "L2", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3046703", "measurand": "Power.Reactive.Import"}, {"phase": "L3", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3803998", "measurand": "Power.Reactive.Import"}, {"phase": "L1", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "'+current1+'", "measurand": "Current.Import"}, {"phase": "L2", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Current.Import"}, {"phase": "L3", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Current.Import"}, {"phase": "L1-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L2-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L3-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L1-L2", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L2-L3", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L3-L1", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "0", "measurand": "Voltage"}, {"phase": "L1", "context": "Sample.Periodic", "value": "0.9984422", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L2", "context": "Sample.Periodic", "value": "0.9989488", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L3", "context": "Sample.Periodic", "value": "0.998432", "location": "Inlet", "measurand": "Power.Factor"}, {"context": "Sample.Periodic", "value": "50.00403", "unit": "Hz", "location": "Inlet", "measurand": "Frequency"}], "timestamp": "'+time_now+'"}]}]')
	#print '[2, "uIDHeJPq6QESJEKY2Tu1qzimdxgfBQNW", "MeterValues", {"transactionId": "'+trans+'", "connectorId": 0, "meterValue": [{"sampledValue": [{"context": "Sample.Periodic", "value": "'+ energy_value +'", "unit": "kWh", "location": "Inlet", "measurand": "Energy.Active.Import.Register"}, {"phase": "L1", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.51885", "measurand": "Power.Active.Import"}, {"phase": "L2", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.559022", "measurand": "Power.Active.Import"}, {"phase": "L3", "unit": "kW", "location": "Inlet", "context": "Sample.Periodic", "value": "6.654507", "measurand": "Power.Active.Import"}, {"phase": "L1", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3597944", "measurand": "Power.Reactive.Import"}, {"phase": "L2", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3046703", "measurand": "Power.Reactive.Import"}, {"phase": "L3", "unit": "kvar", "location": "Inlet", "context": "Sample.Periodic", "value": "0.3803998", "measurand": "Power.Reactive.Import"}, {"phase": "L1", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "'+current1+'", "measurand": "Current.Import"}, {"phase": "L2", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "28.91422", "measurand": "Current.Import"}, {"phase": "L3", "unit": "A", "location": "Inlet", "context": "Sample.Periodic", "value": "29.26725", "measurand": "Current.Import"}, {"phase": "L1-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "222.4919", "measurand": "Voltage"}, {"phase": "L2-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "223.1888", "measurand": "Voltage"}, {"phase": "L3-N", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "223.9568", "measurand": "Voltage"}, {"phase": "L1-L2", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "385.4761", "measurand": "Voltage"}, {"phase": "L2-L3", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "386.9814", "measurand": "Voltage"}, {"phase": "L3-L1", "unit": "V", "location": "Inlet", "context": "Sample.Periodic", "value": "387.4622", "measurand": "Voltage"}, {"phase": "L1", "context": "Sample.Periodic", "value": "0.9984422", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L2", "context": "Sample.Periodic", "value": "0.9989488", "location": "Inlet", "measurand": "Power.Factor"}, {"phase": "L3", "context": "Sample.Periodic", "value": "0.998432", "location": "Inlet", "measurand": "Power.Factor"}, {"context": "Sample.Periodic", "value": "50.00403", "unit": "Hz", "location": "Inlet", "measurand": "Frequency"}], "timestamp": "'+time_now+'"}]}]'
	print("Receiving...")
	result = ws.recv()
	print("Received '%s'" % result)
	
def ping_socket():	

	ws.ping()
	
canvas = ws.create_image(0, 0,anchor=NW,image=my_images[0])
ws.pack()

#b1 = tk.Button(text='IO',command=reboot_pro)
#b1.pack()

#w.create_window(470,271,window=b1)
while True:
    try:
        bootNotification()
        pic_main_start(1)
        root.update()
        break
    except:
        print("Wait connection...")
        pic_ev_wait(1)
        root.update()


#statusNotification("Charging")

#startTransaction()

#time_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

#MeterValue("2015.5","75841")

