import { Measurement } from '../api/models/measure.js';
import { User } from '../api/models/user.js';
import { Crop } from '../api/models/crop.js';
import { System } from '../api/models/system.js';
import { Logs } from '../api/models/logs.js';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { MQTTPubSub } from 'graphql-mqtt-subscriptions';
import { hash, compare } from "bcryptjs";

const { connect } = require('mqtt');
var jwt = require('jsonwebtoken');
const client = connect('mqtt://192.168.178.41', {
  reconnectPeriod: 60000
});

const pubsub = new MQTTPubSub({
  client
});

export const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      console.log("Here is the date! : " + value)
      return new Date(value); // value from the client
    },
    serialize(value) {
      console.log(new Date(value).toISOString())
      return new Date(value * 1000).toISOString();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value) // ast value is always in string format
      }
      return null;
    },
  }),

  Query: {
    getMeasure: () => Measurement.find(),

    getUsers: () => User.find(),

    getSystems: () => System.find(),//5e7b2df8ba660d22b82fbf34
    getUserSystems: async (_, args, context) => {
      var user_id = authRequest(context);
      var systems = [];
      if (user_id != null) {
        var user = await User.findById(user_id);
        if (user) {
          console.log("The problem is after");
          for (var i = 0; i < user.systems.length; i++) {
            console.log(user.systems[i]);
            var system = await System.findById(user.systems[i]);
            if (system) {
              systems.push(system);
            } else {
              console.log("System didn't found");
            }
          }
          return systems;
        } else {
          print("User doesn't exist");
          return [];
        }
      } else {
        console.log("Not authorized");
        return [];
      }
    },

    getAuthPage: async (_, { system_id }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        var system = await System.findById(system_id);
        if (system) {
          var user_names = [];
          var crops_names = [];
          var user_ids_raw = system.authorized_people;
          var crops_ids_raw = system.crops;
          for(var i=0; i< user_ids_raw.length;i++){
            var user = await User.findById(user_ids_raw[i]);
            if(user){
                user_names.push(user.fullname);
            }else{
              throw new Error("User doesn't exist");
            }
          }
          for(var i=0; i< crops_ids_raw.length;i++){
            var crop = await Crop.findById(crops_ids_raw[i]);
            if(crop){
                crops_names.push(crop.name);
            }else{
              throw new Error("Crop doesn't exist");
            }
          }
          return{
            authPeople:user_names,
            cropNames:crops_names
          }

        }
      } else {

        throw new Error("Not authorized");
      }
    },
    getUserProfile: async (_, args, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        var user = await User.findById(user_id);
        var systemNames = [];
        var systemIds = [];
        if (user) {
          var systemsId = user.systems
          for (var i = 0; i < systemsId.length; i++) {
            var system = await System.findById(systemsId[i]);
            console.log(system.system_name);
            console.log(system._id);
            console.log(systemsId);
            if (system) {
              systemNames.push(system.system_name);
              systemIds.push(system._id);
              console.log(system.system_name);
              console.log(system._id);
            } else {
              throw new Error("System doesn't exist");
            }
          }
          console.log(systemNames);
          return {
            fullname: user.fullname,
            email: user.email,
            systemNames: systemNames,
            systemIds: systemIds
          }
        } else {
          throw new Error("User doesn't exist");
        }
      } else {
        throw new Error("Not authorized");
      }
    },

    getCrops: async (_, { system_id }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        var system = await System.findById(system_id);
        var resultList = [];
        if (system) {

          var crops = system.crops;
          console.log(crops);
          for (var i = 0; i < system.crops.length; i++) {
            var crops = await Crop.findById(crops[i]);
            resultList[i] = crops;
          }
          return resultList;
        } else {
          console.log("Array crop not sent");
          return [];
        }
      } else {
        console.log("Not authorized");
        return [];
      }

    },
    getLogs: () => Logs.find(),

    getMeasure_by_id: (_, { system_id, crop_id }, context) => Measurement.findOne({ system_id: system_id, crop_id: crop_id }, {}, { sort: { 'created_at': -1 } }),

    getHomePageSystem: async (_, { system_id }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        var crops = [];
        var measurement = {};
        const system = await System.findById(system_id)
        if (!system) {
          console.log("No system with that ID: " + system_id);
        } else {
          for (var i = 0; i < system.crops.length; i++) {
            const crop = await Crop.findById(system.crops[i]);
            if (crop) {
              crops.push(crop);
            }
          }
          if (crops.length > 0) {
            measurement = await Measurement.findOne({ system_id: system._id, crop_id: crops[0]._id }, {}, { sort: { 'created_at': -1 } })
          } else {
            console.log("System has no crops!");
          }
          console.log(crops);
          console.log(measurement);
          return {
            crops: crops,
            measures_firstCrop: measurement
          }
        }
      } else {
        console.log("Not authorized");

        throw new Error("Could not do it");
      }

    },

    getDataLastHour: (system_id, id_crop) => {
      const current = new Date();

      return Measurement.findById(system_id).find({
        $and: [
          { crop_id: id_crop },
          { day_slot: current.getDay() },
          { month_slot: current.getMonth() },
          { year_slot: current.getFullYear() },
          { hour_slot: (current.getHours() - 1) },
        ]
      })
    },

    getDataLastWeek: (system_id, id_crop, parameter) => {
      const current = new Date();

      return Measurement.findById(system_id).find({
        $and: [
          { crop_id: id_crop },
          { week_slot: ISO8601_week_no(current) - 1 },
          { year_slot: current.getFullYear() },
        ]
      })
    },

    getDataLastYear: (system_id, id_crop, parameter) => {
      const current = new Date();

      return Measurement.findById(system_id).find({
        $and: [
          { crop_id: id_crop },
          { year_slot: current.getFullYear() - 1 },
        ]
      })//TODO:Also select one datapoint per week.                                                    
    },

  },

  Mutation: {
    login: async (_, { username, password }, { res }) => {
      const user = await User.findOne({ username: username });
      console.log("Username: " + username);
      console.log("Password: " + password);
      if (!user) {
        console.log("No user: " + username);
        throw new Error("Could not find user");
      }

      const verify = await compare(password, user.password); // import { hash, compare } from "bcryptjs";
      if (!verify) {
        console.log("Incorrect Password: " + password);
        throw new Error("Wrong Password");
      }
      const access_token = jwt.sign({ userId: user._id }, "secretToken"/*Better an ENV variable*/, { expiresIn: '1d' });

      return {
        accessToken: access_token,
        nr_system: (user.systems).length
      };

    },

    registerUser: async (_, { fullname, email, password, username }) => {
      console.log("Password is: " + password);
      const result = hash(password, 10).then(async function (hash) {
        console.log("Password is: " + hash);
        const newUser = await User.create({
          fullname,
          password: hash,
          email,
          username,
          role: 'user',
          systems: []
        })
        return newUser;
      });
      if (!result) {
        console.log("No sign-up");
        return false;
      }
      else {
        console.log("Successful sign-up");
        return true;
      }

    },
    addCropToSystem: async (_, { crop_name, system_id }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        const system = await System.findById(system_id)
        if (!system) {
          console.log("No system with that otp: " + system_id);
          return false;
        } else {
          const crop = await Crop.findOne({ name: crop_name })
          console.log(crop);
          if (crop) {
            const addSystem = await System.updateOne(
              { _id: system._id },
              { $push: { crops: crop._id } }
            ,
            ).exec();
            if (addSystem) {
              console.log("Crop added to system");
              return true
            } else {
              console.log("Crop not added to system");
              return false;
            }
          }
          else {
            console.log("Crop not added")
            return false;
          }
        }
      } else {
        console.log("Not authorized");
        return false;
      }
    },
    addUserByCode: async (_, { code }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        const user = await User.findById(user_id);
        if (!user) {
          console.log("No user: " + username);
          return false;
        } else {
          const system = await System.findOne({ otp: code })
          if (!system) {
            console.log("No system with that otp: " + username);
            return false;
          } else {
            const updateAuth = await System.updateOne(
              { _id: system._id },
              { $push: { authorized_people: user_id } },
            ).exec();
            const addSystem = await User.updateOne(
              { _id: user._id },
              { $push: { systems: system._id } },
            ).exec();

            if (!updateAuth && !addSystem) {
              console.log("Error in adding authorization")
              return {
                result: false,
                system_id: system._id
              };
              //  throw new Error("Error- Cannot update the setting")
            }
            else {
              return {
                result: false,
                system_id: ""
              }
            }
          }
        }
      }
      else {
        console.log("Non autorizzato");
        return {
          result: false,
          system_id: ""
        };
      }

    },

    createMeasure: async (_, { system_id, crop_id, time, lux, temp_env, hum_env, temp_wat, ph, ec }) => {
      const newTime = new Date(time);
      const measure = new Measurement({
        system_id: system_id,
        crop_id: crop_id,
        time: time,
        hour_slot: newTime.getHours(),
        month_slot: newTime.getMonth(),
        day_slot: newTime.getDay(),
        week_slot: ISO8601_week_no(newTime),
        year_slot: newTime.getFullYear(),
        lux: lux,
        temp_env: temp_env,
        hum_env: hum_env,
        temp_wat: temp_wat,
        ph: ph,
        ec: ec
      });
      await measure.save();
      console.log(measure);

      return measure;
    },

    createCrop: async (_, { crop_name }, context) => {
      var user_id = authRequest(context);
      if (user_id != null) {
        const crop = new Crop({ name: crop_name });
        const result = await crop.save();

        if (!result) {
          console.log("Non è stato possibile inserire " + result);
          throw new Error("Error - Cannot update the setting");
        }
        /* 
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZWEyYWIwOGM1MTEwNTA3ZGM0MzMxYzYiLCJpYXQiOjE1ODc4MjQ2MDUsImV4cCI6MTU4NzkxMTAwNX0.6Px4gKQkFIVwYdzZxedbTLJHGwwVwASYOIX72EIUnSE"
         */
        /*   jwt.verify(token, "secretToken", function (err, decoded) {
            console.log(decoded.userId) // bar
          }); */

        return true;
      }
      else {
        console.log("Non autorizzato");
        return false;
      }
    },

    removeCrop: async (_, { crop_id }) => {
      const result = await Crop.remove(
        { _id: ObjectId(crop_id) }
      );
      if (!result) {
        console.log("Non è stato possibile inserire " + result);
        throw new Error("Error- Cannot update the setting");
      }
      console.log(crop);

      return true;
    },

    createLog: async (_, { system_id, time, value, log_type }) => {
      const logs = new Logs({ system_id, time, value, log_type });
      await logs.save();
      console.log(logs);
      return logs;
    },

    disableAlarm: async (root, { system_id, type_alarm }) => {
      console.log(input, settingId);
      const updateAlarmSetting = await System.updateOne(
        { _id: ObjectId(system_id) },
        { $pull: { active_alarms: type_alarm } }
      ).exec();
      console.log("Error update", updateAlarmSetting);
      if (!updateAlarmSetting) {
        throw new Error("Error- Cannot update the setting");
      }
      return updateAlarmSetting;
    },

    disableAdvice: async (_, { system_id, type_advice }) => {
      const updateAdviceSetting = await System.updateOne(
        { _id: ObjectId(system_id) },
        { $pull: { active_advices: type_advice } }
      ).exec();
      console.log("Error update", updateAdviceSetting)
      if (!updateAdviceSetting) {
        throw new Error("Error- Cannot update the setting");
      }
      return updateAdviceSetting;
    },

    createSystem: async (_, { name }) => {
      var crypto = require("crypto");
      var otp_value = crypto.randomBytes(20).toString('hex');
      var expiry_value = new Date();
      expiry_value.setDate(expiry_value.getDate() + 30); //Expiry day 30 days from when we created the system
      const system = new System({
        system_name: name,
        otp: otp_value,
        expiry_date_otp: expiry_value,
        tmp_lastdata_upload: new Date(),
        firmware_version: '',
        authorized_people: [],
        active_advices: ["water", "light", "nutrients"],
        active_alarms: ["water_low", "toomuch_light", "no_nutrients"],
        crops: []
      });
      const result = await system.save();
      if (!result) {
        console.log("Non è stato possibile inserire " + result);
        throw new Error("Error- Cannot update the setting");
      }
      console.log(system);

      return true;
    },

    addAuthorizedPerson: async (_, { system_id, user_id }) => {
      const updateAuth = await System.update(
        { _id: ObjectId(system_id) },
        { $push: { authorized_people: user_id } },
      ).exec();
      const addSystem = await User.update(
        { _id: ObjectId(user_id) },
        { $push: { systems: system_id } },
      ).exec();

      if (!updateAuth && !addSystem) {
        return false;
        //  throw new Error("Error- Cannot update the setting")
      }
      else {
        return true;
      }
    },

    editUserUsername: async (_, { user_id, new_username }) => {
      const updateAuth = await User.update(
        { _id: ObjectId(user_id) },
        { $push: { username: new_username } },
      ).exec();
      if (!updateAuth) {
        return false;
        //  throw new Error("Error- Cannot update the setting")
      }
      else {
        return true;
      }
    },

    updateFirmware: async (_, { system_id, new_version }) => {
      const updateAuth = await System.update(
        { _id: ObjectId(system_id) },
        { $set: { firmware_version: new_version } },
      ).exec();
      if (!updateAuth) {
        return false;
        //  throw new Error("Error- Cannot update the setting")
      }
      else {
        return true;
      }
    },

  },

  Subscription: {
    subscribe2topic: {
      resolve: async (payload) => {
        const newTime = new Date()
        var crypto = require("crypto");
        var sys_crop_rand_id = crypto.randomBytes(20).toString('hex');
        const measure = new Measurement({
          system_id: "5ea6e4eb30272ea33efc1ce2",
          crop_id: "5ea6e4eb30272ea33efc1ce1",
          time: new Date(payload.data.time * 1000),
          hour_slot: newTime.getHours(),
          month_slot: newTime.getMonth(),
          day_slot: newTime.getDay(),
          week_slot: ISO8601_week_no(newTime),
          year_slot: newTime.getFullYear(),
          lux: payload.data.lux,
          temp_env: payload.data.temp,
          hum_env: payload.data.hum,
          temp_wat: payload.data.temp_res,
          ph: payload.data.pH,
          ec: payload.data.ec
        });
        var result = await measure.save();
        if (!result) {
          console.log("Misure non inserite!")
        } else {
          console.log("Misure inserite in system: ");
          console.log(measure);
        }
        return {
          time: new Date(payload.data.time * 1000),
          lux: payload.data.lux,
          temp: payload.data.temp,
          hum: payload.data.hum,
          temp_res: payload.data.temp_res,
          pH: payload.data.pH,
          ec: payload.data.ec
        };

      },
      subscribe: (_, args) => { return pubsub.asyncIterator([args.topic]) }

    }
  }
}

function ISO8601_week_no(dt) {
  var tdt = new Date(dt.valueOf());
  var dayn = (dt.getDay() + 6) % 7;
  tdt.setDate(tdt.getDate() - dayn + 3);
  var firstThursday = tdt.valueOf();
  tdt.setMonth(0, 1);
  if (tdt.getDay() !== 4) {
    tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - tdt) / 604800000);
}

function authRequest(context) {

  var token = (context.req.headers.authorization).replace('Bearer ', '');
  console.log(token);

  try {
    var decoded = jwt.verify(token, "secretToken");
    return decoded.userId;
  } catch (err) {
    console.log(err);
    return null;
  };
}
