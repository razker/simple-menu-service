const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const SERVER_CONFIGS = require('./constants/server');
const configureServer = require('./server');
require('dotenv').config();

const app = express();
configureServer(app);

const dbUserName = process.env.DB_USER_NAME;
const dbPassword = process.env.DB_PASSWORD;
const dbClusterUrl = process.env.DB_CLUSTER_URL;

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@${dbClusterUrl}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/getRestaurantsDetails', async (req,res) => {

    const database = client.db("restaurants_app");
    const restaurants = database.collection("restaurants_details");

    const restaurantDataCursor = await restaurants.find();

    const data = await restaurantDataCursor.toArray();
    res.send(data);

});

app.get('/getMenuDetails', async (req,res) => {
    const { restaurantId } = req.query;
    const database = client.db("restaurants_app");
    const menuItems = database.collection("menu_items");
    const restaurantDataCursor = await menuItems.find({"restaurantId": String(restaurantId)});

    const data = await restaurantDataCursor.toArray();
    res.send(data);
});

app.post('/createMenuItem', async (req, res) => {
    const { title, description, price, menuType, restaurantId } = req.body;
    const database = client.db("restaurants_app");
    const menuItems = database.collection("menu_items");

    try {
        const insertResult = await menuItems.insertOne(
            {
                    title,
                    description,
                    menuType,
                    restaurantId,
                    price: Number(price)
            });

        res.send({success: insertResult.result.n > 0});

    } catch (e) {
        console.log(e);
    }

});

app.put('/updateMenuItem', async (req,res) => {
    const { id, title, description, price, menuType } = req.body;
    const database = client.db("restaurants_app");
    const menuItems = database.collection("menu_items");

    try {
        const updateResult = await menuItems.updateOne(
            { "_id" : ObjectID(id) },
            { $set: {
                "title" : title,
                "description" : description,
                "price" : Number(price),
                "menuType" : menuType
                }});

        res.send({success: updateResult.result.n > 0});

    } catch (e) {
        console.log(e);
    }
})

app.delete('/deleteMenuItem', async (req,res) => {
    const { id } = req.body;
    const database = client.db("restaurants_app");
    const menuItems = database.collection("menu_items");

    try {
        const deleteResult = await menuItems.deleteOne(
            { "_id" : ObjectID(id) });

        res.send({success: deleteResult.result.n > 0});

    } catch (e) {
        console.log(e);
    }
})

app.listen(SERVER_CONFIGS.PORT, async error => {
    await client.connect();
    if(error) throw error;
    console.log('Server running on port: ' + SERVER_CONFIGS.PORT);
});
