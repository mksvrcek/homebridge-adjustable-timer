"use strict";

var Service, Characteristic, HomebridgeAPI;
const { HomebridgeDummyVersion } = require('./package.json');

module.exports = function (api) {
  api.registerPlatform('AdjustableDummyTimerPlatform', AdjustableDummyTimerPlatform)

  //Service = homebridge.hap.Service;
  //Characteristic = homebridge.hap.Characteristic;
  //HomebridgeAPI = homebridge;
  //homebridge.registerAccessory("homebridge-dummy-timer-custom-45n3u54u134n5iun", "DummyTimer", DummyTimer);
}

class AdjustableDummyTimerPlatform {
    constructor(log, config, api) {
        this.accessories = [];
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
        this.log = log;
        
        log.debug(config)
        
        api.on('didFinishLaunching', () => {
            
            
            const uuid = api.hap.uuid.generate('AdjustableDummyTimerPlatform')
            if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
                const platform = new api.platformAccessory('Adjustable Timer Platform', uuid);
                api.registerPlatformAccessories('@theproductroadmap/homebridge-adjustable-timer', 'AdjustableDummyTimerPlatform', [platform])
                this.accessories.push(platform)
            }
            
            config.timers.forEach((timer) => {
                new DummyTimer(log, timer, api, this.accessories[0]);
            });
            
            log.debug('launched')
        });
        
        
        log.debug('Platform Loaded')
    }
    
    configureAccessory(accessory) {
        this.log.debug("Configuring Accessory:" + accessory)
        this.accessories.push(accessory);
    }
}


class DummyTimer {
    constructor (log, config, api, platform) {
    log.debug("yaaas")
  this.log = log;
  this.name = config.name;
  this.dimmer = true;
  this.isTimer = true;
  this.delay = 60000;
  this.delayUnit = config.delayUnit;
  this.defBrightness = config.brightness;
  this.brightness = config.brightness;
  this.brightnessStorageKey = this.name + "Brightness";
  this.timer = null;
  this.disableLogging = config.disableLogging;
  this.platform = platform;

  this.sensor = config.sensor;
  this.sensorTriggered = 0;

  this.delay = (() => {
    switch(this.delayUnit) {
      case "s": return 1000
      case "m": return 60000
      case "h": return 3600000
      case "d": return 86400000
      default: return 60000;
    }
  })();

  
//   this._service = new Service.Lightbulb(this.name);
    this.timerRepresentative = platform.getService('Dummy-Timer-' + config.name.replace(/\s/g, '-'))
    if (!this.timerRepresentative) {
        log.debug("Created service: " + 'Dummy-Timer-' + config.name.replace(/\s/g, '-'))
        this.timerRepresentative = platform.addService(api.hap.Service.Lightbulb, 'Dummy-Timer-' + config.name.replace(/\s/g, '-'), 'timer')
        // new DummyTimer(log, timer, api, this.accessories[0]);
    }
  this.modelString = "Dummy Timer";
  

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
//   this.informationService = new Service.AccessoryInformation();
//   this.informationService
//     .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
//     .setCharacteristic(Characteristic.Model, this.modelString)
//     .setCharacteristic(Characteristic.FirmwareRevision, HomebridgeDummyVersion)
//     .setCharacteristic(Characteristic.SerialNumber, 'Dummy-Timer-' + this.name.replace(/\s/g, '-'));

//   this.cacheDirectory = HomebridgeAPI.user.persistPath();
//   this.storage = require('node-persist');
//   this.storage.initSync({ dir: this.cacheDirectory, forgiveParseErrors: true });

  this.timerRepresentative.getCharacteristic(this.Characteristic.On)
    .on('set', this._setOn.bind(this));
	
  
  this.timerRepresentative.getCharacteristic(this.Characteristic.Brightness)
    .on('get', this._getBrightness.bind(this))
    .on('set', this._setBrightness.bind(this));
	
//   var cachedBrightness = this.storage.getItemSync(this.brightnessStorageKey);
//   if ((cachedBrightness == undefined) || cachedBrightness == 0) {
      this.timerRepresentative.setCharacteristic(this.Characteristic.On, false);
      this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, 0);
//   } else {
//       this._service.setCharacteristic(Characteristic.On, true);
//       this._service.setCharacteristic(Characteristic.Brightness, cachedBrightness);
//   }

//   var cachedState = this.storage.getItemSync(this.name);
//   if((cachedState === undefined) || (cachedState === false)) {
// 	this._service.setCharacteristic(Characteristic.On, false);
//       } else {
// 	this._service.setCharacteristic(Characteristic.On, true);
//   }

  this.getSensorState = () => {
	const state = this.sensorTriggered
	if (this.sensor === 'motion')
		return !!state
	return state
   }
   
   
   if (this.sensor != "off") {
    switch (this.sensor) {
      case 'contact':
        // this.sensorService = new this.Service.ContactSensor(this.name + ' Trigger')
        
        this.sensorCharacteristic = this.Characteristic.ContactSensorState
        this.sensorService = this.platform.getService('Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
        if (!this.sensorService) {
            log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
            this.sensorService = this.platform.addService(api.hap.Service.ContactSensor, 'Dummy-Timer-' + config.name.replace(/\s/g, '-'), 'timer-trigger')
        }
        
        break
      case 'occupancy':
        // this.sensorService = new this.Service.OccupancySensor(this.name + ' Trigger')
        
        this.sensorCharacteristic = this.Characteristic.OccupancyDetected
        this.sensorService = this.platform.getService('Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
        if (!this.sensorService) {
            log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
            this.sensorService = this.platform.addService(api.hap.Service.OccupancySensor, 'Dummy-Timer-' + config.name.replace(/\s/g, '-'), 'timer-trigger')
        }
        
        break
      case 'leak':
        this.sensorService = new this.Service.LeakSensor(this.name + ' Trigger')
        this.sensorCharacteristic = Characteristic.LeakDetected
        break
      default:
        this.sensorService = new this.Service.MotionSensor(this.name + ' Trigger')
        this.sensorCharacteristic = this.Characteristic.MotionDetected
        break
      }
  
      this.sensorService
        .getCharacteristic(this.sensorCharacteristic)
        .on('get', (callback) => {
          callback(null, this.getSensorState())
        })
  }
   
   
    }
}

// DummyTimer.prototype.getServices = function () {
//   var services = [this.informationService, this._service];

//   if (this.sensor != "off") {
//     switch (this.sensor) {
//       case 'contact':
//         // this.sensorService = new this.Service.ContactSensor(this.name + ' Trigger')
        
//         this.sensorCharacteristic = this.Characteristic.ContactSensorState
//         this.sensorService = this.platform.getService('Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
//         if (!this.sensorService) {
//             log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
//             this.sensorService = this.platform.addService(api.hap.Service.ContactSensor, 'Dummy-Timer-' + config.name.replace(/\s/g, '-'), 'timer')
//         }
        
//         break
//       case 'occupancy':
//         // this.sensorService = new this.Service.OccupancySensor(this.name + ' Trigger')
        
//         this.sensorCharacteristic = this.Characteristic.OccupancyDetected
//         this.sensorService = this.platform.getService('Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
//         if (!this.sensorService) {
//             log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
//             this.sensorService = this.platform.addService(api.hap.Service.OccupancySensor, 'Dummy-Timer-' + config.name.replace(/\s/g, '-'), 'timer')
//         }
        
//         break
//       case 'leak':
//         this.sensorService = new this.Service.LeakSensor(this.name + ' Trigger')
//         this.sensorCharacteristic = Characteristic.LeakDetected
//         break
//       default:
//         this.sensorService = new this.Service.MotionSensor(this.name + ' Trigger')
//         this.sensorCharacteristic = this.Characteristic.MotionDetected
//         break
//       }
  
//       this.sensorService
//         .getCharacteristic(this.sensorCharacteristic)
//         .on('get', (callback) => {
//           callback(null, this.getSensorState())
//         })
  
//       services.push(this.sensorService)
//   }

//   return services;
// }

DummyTimer.prototype._getBrightness = function (callback) {

  if (!this.disableLogging) {
    this.log("Getting " + "brightness: " + this.brightness);
  }

  callback(null, this.brightness);
}

DummyTimer.prototype._setBrightness = function (brightness, callback) {

  if (!this.disableLogging) {
    var msg = "Setting brightness: " + brightness
    this.log(msg);
  }

  this.brightness = brightness;
//   this.storage.setItemSync(this.brightnessStorageKey, brightness);

  callback();
}

DummyTimer.prototype._setOn = function (on, callback) {

  var msg = "Setting switch to " + on
  if (!this.disableLogging) {
    this.log(msg);
  }

  if (this.isTimer) {
    if (on) {
      this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, this.defBrightness);
      this.brightness = this.defBrightness

      this.timer = setInterval(function () {
        if (this.brightness > 1) {
          this.brightness = this.brightness - 1
          this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, this.brightness);
	   //   this.storage.setItemSync(this.brightnessStorageKey, this.brightness);
        } else {
          clearInterval(this.timer);
          this.timerRepresentative.setCharacteristic(this.Characteristic.On, false);

          if (this.sensor != "off") {
            this.sensorTriggered = 1
            this.sensorService.getCharacteristic(this.sensorCharacteristic).updateValue(this.getSensorState())
            this.log('Triggering Sensor')
            setTimeout(function () {
              this.sensorTriggered = 0
              this.sensorService.getCharacteristic(this.sensorCharacteristic).updateValue(this.getSensorState())
            }.bind(this), 3000)
          }
        }
      }.bind(this), this.delay)
    } else {
      clearInterval(this.timer);
    }
  }

//   this.storage.setItemSync(this.name, on);

  callback();
}
