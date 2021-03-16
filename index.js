require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const SERVER_CONFIGS = require('./constants/server');
const configureServer = require('./server');

const app = express();
configureServer(app);

const dbUserName = process.env.DB_USER_NAME;
const dbPassword = process.env.DB_PASSWORD;
const dbClusterUrl = process.env.DB_CLUSTER_URL;
const uri = `mongodb+srv://${dbUserName}:${dbPassword}@${dbClusterUrl}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/getRestaurantsDetails', async (req,res) => {

    try {
        const database = client.db("restaurants_app");
        const restaurants = database.collection("restaurants_details");
        const menuItems = database.collection("menu_items");

        const restaurantDataCursor = await restaurants.find();
        const restaurantsData = await restaurantDataCursor.toArray();

        let restaurantsWithMenu = [];

        for (let index = 0; index < restaurantsData.length; index++) {
            const returnedData = await menuItems.findOne({"restaurantId": String(restaurantsData[index].restaurantId)});
            if (returnedData) {
                restaurantsWithMenu.push(restaurantsData[index]);
            }
        }

        res.send(restaurantsWithMenu);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }

});

app.get('/getMenuDetails', async (req,res) => {
    const { restaurantId } = req.query;
    try{
        const database = client.db("restaurants_app");
        const menuItems = database.collection("menu_items");
        const restaurantDataCursor = await menuItems.find({"restaurantId": String(restaurantId)});

        const data = await restaurantDataCursor.toArray();
        res.send(data);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }

});

app.post('/createMenuItem', async (req, res) => {
    const { title, description, price, menuType, restaurantId } = req.body;

    try {
        const database = client.db("restaurants_app");
        const menuItems = database.collection("menu_items");
        const insertResult = await menuItems.insertOne(
            {
                    title,
                    description,
                    menuType,
                    restaurantId,
                    price: Number(price)
            });

        res.send({success: insertResult.result.n > 0});

    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }

});

app.put('/updateMenuItem', async (req,res) => {
    const { id, title, description, price, menuType } = req.body;

    try {
        const database = client.db("restaurants_app");
        const menuItems = database.collection("menu_items");
        const updateResult = await menuItems.updateOne(
            { "_id" : ObjectID(id) },
            { $set: {
                "title" : title,
                "description" : description,
                "price" : Number(price),
                "menuType" : menuType
                }});

        res.send({success: updateResult.result.n > 0});

    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }
})

app.delete('/deleteMenuItem', async (req,res) => {
    const { id } = req.body;

    try {
        const database = client.db("restaurants_app");
        const menuItems = database.collection("menu_items");

        const deleteResult = await menuItems.deleteOne(
            { "_id" : ObjectID(id) });

        res.send({success: deleteResult.result.n > 0});

    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }
})

app.listen(SERVER_CONFIGS.PORT, async error => {
    await client.connect();
    if(error) throw error;
    console.log('Server running on port: ' + SERVER_CONFIGS.PORT);
});
