
# "Dummy Timer" Plugin

Example config.json:

```
    {
    "name": "motion",
    "brightness": 10,
    "delayUnit": "s",
    "sensor": "motion",
    "disableLogging": false,
    "accessory": "DummyTimer"
}

```

This plugin an expansion on [nfarina/homebridge-dummy](https://github.com/nfarina/homebridge-dummy), it allows you to create timers that act as dimmer lights. Once triggered the light will tick down a % every second/minute/hour/day until it reaches 0 and turns off, allowing you to setup automatizations in homekit or elsewhere.


Config:

## Sensor
You may set the "sensor" variable to any of the following:
 - motion
 - contact
 - occupancy
 - leak
 - off

 Unless it's set to off the plugin will setup an additional sensor that will trigger when the timer is up. Allowing you to turn off the timer without it triggering your automations (setup your automations on the sensors activity). If you prefer no sensor you can use [nfarina/homebridge-dummy](https://github.com/nfarina/homebridge-dummy) to setup a switch that.

 1. turns off the timer
 2. turns off itself
 (You will need to add a condition to you automation for it not to trigger when this newly created switch is on.)

 ## Brightness
 The brightness variable specifies a value for the switch to start on, if you toggle it on it will automatically jump to this number irregardless of what it was on previously.

 ## Delay Unit
 Delay unit can be set to any of the following and specifies how long will each % take.
 - "s" Second
 - "m" Minute
 - "h" Hour
 - "d" Day

 *Example: If delay unit is "m" and switch brightness is 60, it will take 1 minute to trigger.*