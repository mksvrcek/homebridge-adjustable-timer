"use strict";

var Service, Characteristic, HomebridgeAPI;
const { HomebridgeDummyVersion } = require('./package.json');

module.exports = function (homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-dummy-timer-custom-45n3u54u134n5iun", "DummyTimer", DummyTimer);
}


function DummyTimer(log, config) {
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

  this.delay = (() => {
    switch(this.delayUnit) {
      case "s": return 1000
      case "m": return 60000
      case "h": return 3600000
      case "d": return 86400000
      default: return 60000;
    }
  })();

  if (this.dimmer) {
    this._service = new Service.Lightbulb(this.name);
    this.modelString = "Dummy Timer";
  }

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
    .setCharacteristic(Characteristic.Model, this.modelString)
    .setCharacteristic(Characteristic.FirmwareRevision, HomebridgeDummyVersion)
    .setCharacteristic(Characteristic.SerialNumber, 'Dummy-Timer-' + this.name.replace(/\s/g, '-'));

  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({ dir: this.cacheDirectory, forgiveParseErrors: true });

  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));
  if (this.dimmer) {
    this._service.getCharacteristic(Characteristic.Brightness)
      .on('get', this._getBrightness.bind(this))
      .on('set', this._setBrightness.bind(this));
  }

  if (this.dimmer) {
    var cachedBrightness = this.storage.getItemSync(this.brightnessStorageKey);
    if ((cachedBrightness == undefined) || cachedBrightness == 0) {
      this._service.setCharacteristic(Characteristic.On, false);
      this._service.setCharacteristic(Characteristic.Brightness, 0);
    } else {
      this._service.setCharacteristic(Characteristic.On, true);
      this._service.setCharacteristic(Characteristic.Brightness, cachedBrightness);
    }
  }
}

DummyTimer.prototype.getServices = function () {
  return [this.informationService, this._service];
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
  this.storage.setItemSync(this.brightnessStorageKey, brightness);

  callback();
}

DummyTimer.prototype._setOn = function (on, callback) {

  var msg = "Setting switch to " + on
  if (!this.disableLogging) {
    this.log(msg);
  }

  if (this.isTimer) {
    if (on) {
      this._service.setCharacteristic(Characteristic.Brightness, this.defBrightness);
      this.brightness = this.defBrightness

      this.timer = setInterval(function () {
        if (this.brightness > 1) {
          this.brightness = this.brightness - 1
          this._service.setCharacteristic(Characteristic.Brightness, this.brightness);
        } else {
          clearInterval(this.timer);
          this._service.setCharacteristic(Characteristic.On, false);
        }
      }.bind(this), this.delay)
    } else {
      clearInterval(this.timer);
    }
  }

  callback();
}
