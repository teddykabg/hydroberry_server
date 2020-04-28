import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { jwt } from 'jsonwebtoken';
import { typeDefs } from '../schema/typeDefs.js';
import { resolvers } from '../schema/resolvers.js';
import { createServer } from 'http';
import { User } from '../api/models/user.js';
const startServer = async () => {
    const PORT = process.env.PORT || 4000;
    const app = express();
    var mongoose = require('mongoose');
    var bodyParser = require('body-parser');

    mongoose.Promise = global.Promise;
    try {
        await mongoose.connect('mongodb+srv://dbUser:Gt3nKGcfMQzbKmUZ@cluster0-mqdxp.mongodb.net/HydroBerry_0?replicaSet=Cluster0-shard-0&connectTimeoutMS=10000&authSource=admin', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
        console.log("Connected to dB!");
    } catch (err) {
        console.log("Not Connected to dB!");
    }
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    //app.use('*', jwtCheck, requireAuth, checkScope);

    /*   const myPlugin = {
          // Fires whenever a GraphQL request is received from a client.
          requestDidStart(requestContext) {
              console.log('Request started! Query:\n' +
                  requestContext.request.query);
  
          }
      } */
    const server = new ApolloServer({
        context: async ({ req ,res}) =>({req,res}),
        typeDefs,
        resolvers,
       
    });

    server.applyMiddleware({ app });
    const httpServer = createServer(app);
    server.installSubscriptionHandlers(httpServer);

    httpServer.listen({ port: PORT }, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
        console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
    })
}

startServer();
