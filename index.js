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
    this.config = config;
    this.api = api
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.log = log;

    log.debug(config)

    api.on('didFinishLaunching', () => {
      const currentAccessoryUUIDs = [];

      config.timers.forEach((timer) => {
        this.log("Initializing timer: " + timer.name);
        if (timer.name && timer.delayUnit && timer.sensor) {
          const uuid = api.hap.uuid.generate(timer.name);
          currentAccessoryUUIDs.push(uuid);
  
          if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
            const platform = new api.platformAccessory(timer.name, uuid);
            api.registerPlatformAccessories('@theproductroadmap/homebridge-adjustable-timer', config.name, [platform])
            this.accessories.push(platform)
            new DummyTimer(log, timer, api, platform);
          } else {
            let platform = this.accessories.find(accessory => accessory.UUID === uuid);
            new DummyTimer(log, timer, api, platform);
          }
        } else {
          this.log("Failed to initialize timer, one or more required variables are missing. (Required variables: name, delayUnit, sensor)")
        }
      });

      // Unregister accessories not present in the config
      this.accessories.forEach((accessory) => {
        if (!currentAccessoryUUIDs.includes(accessory.UUID)) {
          this.log("Unregistering accessory: " + accessory.displayName);
          api.unregisterPlatformAccessories('@theproductroadmap/homebridge-adjustable-timer', 'AdjustableDummyTimerPlatform', [accessory]);
        }
      });

      log.debug('launched')
    });


    log.debug('Platform Loaded')
  }

  configureAccessory(accessory) {
    this.log.debug("Found cached accessory:" + accessory.UUID)
    this.accessories.push(accessory);
  }
}

class DummyTimer {
  constructor(log, config, api, platform) {
    log.debug("yaaas")
    this.config = config;
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
      switch (this.delayUnit) {
        case "s": return 1000
        case "m": return 60000
        case "h": return 3600000
        case "d": return 86400000
        default: return 60000;
      }
    })();



    this.timerRepresentative = platform.getService(config.name)
    if (!this.timerRepresentative) {
      log.debug("Created service: " + 'Dummy-Timer-' + config.name.replace(/\s/g, '-'))
      this.timerRepresentative = platform.addService(api.hap.Service.Lightbulb, config.name, 'timer')
    }
    this.modelString = "Adjustable Dummy Timer";


    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;




    this.platform.getService(this.Service.AccessoryInformation)
      .setCharacteristic(this.Characteristic.Manufacturer, "mksvrcek")
      .setCharacteristic(this.Characteristic.Model, "Adaptable Dummy Timer")
      .setCharacteristic(this.Characteristic.SerialNumber, api.hap.uuid.generate(this.name))
      .setCharacteristic(this.Characteristic.FirmwareRevision, HomebridgeDummyVersion)

    //   this.cacheDirectory = HomebridgeAPI.user.persistPath();
    //   this.storage = require('node-persist');
    //   this.storage.initSync({ dir: this.cacheDirectory, forgiveParseErrors: true });

    this.timerRepresentative.getCharacteristic(this.Characteristic.On)
      .on('set', this._setOn.bind(this));


    this.timerRepresentative.getCharacteristic(this.Characteristic.Brightness)
      .on('get', this._getBrightness.bind(this))
      .on('set', this._setBrightness.bind(this));

    var cachedBrightness = this.platform.context.cachedBrightness;
    if ((cachedBrightness == undefined) || cachedBrightness == 0) {
      this.timerRepresentative.setCharacteristic(this.Characteristic.On, false);
      this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, 0);
    } else {
      this.timerRepresentative.setCharacteristic(this.Characteristic.On, true);
      this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, cachedBrightness);
    }

    this.getSensorState = () => {
      const state = this.sensorTriggered
      if (this.sensor === 'motion')
        return !!state
      return state
    }


    this._checkIfSensorChanged()

    if (this.sensor != "off") {
      switch (this.sensor) {
        case 'contact':

          this.sensorCharacteristic = this.Characteristic.ContactSensorState
          this.sensorService = this.platform.getService(this.name + " Contact Trigger")
          if (!this.sensorService) {
            log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
            this.sensorService = this.platform.addService(api.hap.Service.ContactSensor, this.name + " Contact Trigger", 'timer-trigger')
          }

          break
        case 'occupancy':

          this.sensorCharacteristic = this.Characteristic.OccupancyDetected
          this.sensorService = this.platform.getService(this.name + " Occupancy Trigger")
          if (!this.sensorService) {
            log.debug("Created service: " + 'Dummy-Timer-Trigger-' + this.name.replace(/\s/g, '-'))
            this.sensorService = this.platform.addService(api.hap.Service.OccupancySensor, this.name + " Occupancy Trigger", 'timer-trigger')
          }

          break
        case 'leak':

          this.sensorCharacteristic = this.Characteristic.LeakDetected
          this.sensorService = this.platform.getService(this.name + " Leak Trigger")
          if (!this.sensorService) {
            log.debug("Created service: " + this.name + " Leak Trigger")
            this.sensorService = this.platform.addService(api.hap.Service.LeakSensor, this.name + " Leak Trigger", 'timer-trigger')
          }

          break
        default:

          this.sensorCharacteristic = this.Characteristic.MotionDetected
          this.sensorService = this.platform.getService(this.name + " Motion Trigger")
          if (!this.sensorService) {
            log.debug("Created service: " + this.name + " Leak Trigger")
            this.sensorService = this.platform.addService(api.hap.Service.MotionSensor, this.name + " Motion Trigger", 'timer-trigger')
          }
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


DummyTimer.prototype._checkIfSensorChanged = function () {
  let contactSensor = this.platform.getService(this.name + " Contact Trigger")
  if (contactSensor && this.sensor != "contact") { this.platform.removeService(contactSensor); this.log.debug("Removing service: " + this.name + " Contact Trigger"); }
  let occupancySensor = this.platform.getService(this.name + " Occupancy Trigger")
  if (occupancySensor && this.sensor != "occupancy") { this.platform.removeService(occupancySensor); this.log.debug("Removing service: " + this.name + " Occupancy Trigger"); }
  let leakSensor = this.platform.getService(this.name + " Leak Trigger")
  if (leakSensor && this.sensor != "leak") { this.platform.removeService(leakSensor); this.log.debug("Removing service: " + this.name + " Leak Trigger"); }
  let motionSensor = this.platform.getService(this.name + " Motion Trigger")
  if (motionSensor && this.sensor != "motion") { this.platform.removeService(motionSensor); this.log.debug("Removing service: " + this.name + " Motion Trigger"); }
}

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
  this.platform.context.cachedBrightness = brightness;
  callback();
}

DummyTimer.prototype._setOn = function (on, callback) {

  var msg = "Setting switch to " + on
  if (!this.disableLogging) {
    this.log(msg);
  }

  if (this.isTimer) {
    if (on) {

      if (!this.config.pausable) {
        this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, this.defBrightness);
        this.brightness = this.defBrightness
      } else {
        this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, this.brightness);
        this.brightness = this.brightness
      }

      this.timer = setInterval(function () {
        if (this.brightness > 1) {
          this.brightness = this.brightness - 1
          this.timerRepresentative.setCharacteristic(this.Characteristic.Brightness, this.brightness);
          //   this.storage.setItemSync(this.brightnessStorageKey, this.brightness);
          this.platform.context.cachedBrightness = this.brightness;
        } else {
          clearInterval(this.timer);
          this.timerRepresentative.setCharacteristic(this.Characteristic.On, false);
          this.brightness = this.config.brightness;

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
      if (!this.config.pausable) {
        this.platform.context.cachedBrightness = null;
      } else {
        this.platform.context.cachedBrightness = this.brightness;
      }
      this.log.debug("Clear Interval")
      clearInterval(this.timer);
    }
  }

  //   this.storage.setItemSync(this.name, on);
  // this.platform.context.cachedState = on;
  callback();
}








