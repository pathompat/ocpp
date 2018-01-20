from autobahn.asyncio.wamp import ApplicationSession,ApplicationRunner
import asyncio
cp_id = "CP001"

bootnoti_packet = [2,"19223201", "BootNotification",
                   {"chargePointVendor": "VendorX",
                    "chargePointModel": "SingleSocketCharger"} ];

auth_packet = [2,"18521553","Authorize",
               {"idTag":"123456789"}];

class MyComponent(ApplicationSession):
    async def onJoin(self, details):
        print("session ready")
        try:
            res = await self.call(u'com.myapp.auth',auth_packet[0],
                                  auth_packet[1],auth_packet[2],
                                  auth_packet[3])
            print("call result: {}".format(res))
        except Exception as e:
            print("call error: {0}".format(e))
        self.leave()
            
    def onDisconnect(self):
        print("End")
        asyncio.get_event_loop().stop()

runner = ApplicationRunner(url=u"ws://localhost:8080/ocpp", realm=u"realm1")
runner.run(MyComponent)
