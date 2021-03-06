import { gql } from 'apollo-server-express';

export const typeDefs = gql`
scalar Date

type SensorData {
    temp:Float!,
	hum:Float!,
    lux:Boolean!,
    temp_res:Float!,
    pH:Float!,
    ec:Float!,
	time:Date!
},

type User{
    _id:ID!,
    fullname: String!,
    password: String!,
    email: String!,
    username: String,
    role :String,
    systems: [ID!]
},

type Crop{
    _id: ID!,
    name : String!
},

type System{
    _id: ID!,
    system_name: String!,
    otp : String,
    expiry_date_otp : Date, 
    tmp_lastdata_upload: Date!,
    firmware_version: String!,
    authorized_people : [ID],
    active_advices: [String],
    active_alarms: [String],
    crops: [ID]
},

type Measurement{
    _id:ID!,
    system_id : ID!,
	crop_id : ID!,
	time: Date!,
    hour_slot: Int!,
    month_slot: Int, 
    day_slot: Int!, 
    week_slot: Int!,
    year_slot:Int!,
    lux: Boolean!,
    temp_env : Float!,
    hum_env: Float!,
    temp_wat: Float!,
    ph : Float!,
    ec: Float!

},

type GraphDataHour{
    _id:ID!,
    hour_slot: Int!, 
    lux: Boolean!,
    temp_env : Float!,
    hum_env: Float!,
    temp_wat: Float!,
    ph : Float!,
    ec: Float!

},


type Logs{
	_id : ID!,
	system_id : ID!,
	time : Date!,
	value : String!,
	log_type : ID! 
},

type loginResponse{
    accessToken:String!,
    nr_system: Int!
},

type codeResponse{
    result:Boolean!,
    system_id:String!
},

type Homepage{
    crops:[Crop!],
    measures_firstCrop:Measurement!
},

type Profile{
    fullname:String!,
    email:String!,
    systemNames:[String!],
    systemIds: [String!]
},

type AuthPage{
    authPeople:[String!],
    cropNames:[String!]
},

type Query{
    hello: String!,

    getSystems:[System!],

    getUserProfile:Profile!,

    getUserSystems:[System!],

    getAuthPage(system_id:ID!):AuthPage!,

    getHomePageSystem(system_id: ID!):Homepage!,

    getUsers:[User!],

    getCrops(system_id : ID!):[Crop!],

    getLogs:[Logs!],

    getMeasure_by_id(system_id : ID!,
         crop_id:ID!) : Measurement,

    getMeasure:[Measurement!]! ,#Has to get the measure from mqtt every minute ("subscription to topic")

    getDataLastHour(system_id:ID!,id_crop:ID!):[GraphDataHour!],

    getDataLastWeek(system_id:ID!,id_crop:ID!):[Float],

    getDataLastYear(system_id:ID!,id_crop:ID!):[Float],

},
type Mutation{

    editFullname(new_value:String!):Boolean!,

    editPassword(new_value:String!):Boolean!,

    editEmail(new_value:String!):Boolean!,

    removeAuthPerson(system_id:ID!,
        index:Int!):Boolean!,

    newSession(user_id:String!,
        access_token:String!):Boolean!,
    
    removeSession(access_token:String!):Boolean!,

    addUserByCode(code:String!):codeResponse!,

    createMeasure (system_id:String!,
        crop_id:String!,
        time:Date!,
        lux : Boolean!,
        temp_env : Float!,
        hum_env : Float!,
        temp_wat : Float!,
        ph : Float!,
        ec : Float! ):Measurement!,

    login(username:String!,
        password:String!):loginResponse!, #Returns authentication token
    
    registerUser(fullname:String!,
        email:String!,
        password:String!,
        username:String!):Boolean!, #Returns an auth token if everything is ok otherwwise empty

    createLog (system_id : ID!,
        time : Date!,
        value : String!,
        log_type : ID! ):Boolean!,

    disableAlarm (system_id : ID!,
         type_alarm : String!):Boolean!,

    disableAdvice (system_id : ID! ,
        type_advice : String!):Boolean!,

    createSystem(name:String!):Boolean!,

    createCrop (crop_name : String):Boolean!,

    addCropToSystem (crop_name : String, 
        system_id:String!):Boolean!,

    removeCrop (crop_name : String):Boolean!,

    addAuthorizedPerson (system_id:ID!, user_id : ID!):Boolean!,

    editUserUsername(user_id : ID!, new_username:String!):Boolean!,

    updateFirmware(system_id:ID!,new_version:String!):String!

},
schema {
    query: Query,
    mutation: Mutation,
    subscription: Subscription
},

type Subscription {
    subscribe2topic(topic: String!): SensorData!
}
`;