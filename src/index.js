'use strict';
const Alexa = require("alexa-sdk");

const request = require('request');
const cheerio = require('cheerio');

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};


const handlers = {
    'LaunchRequest': function () {
        this.emit('SayHello');
    },
    'CheapestPrice': function () {
        const cityName = this.event.request.intent.slots.City.value;
        const stateName = this.event.request.intent.slots.State.value;
        const zipName = this.event.request.intent.slots.Zip.value;
        
        let query;

        if (zipName) { query = zipName; }
        else {
            if (cityName && stateName) {
                query = cityName+' '+stateName;
            }
            else if (cityName) { query = cityName; }
            else if (stateName) { query = stateName; }
        }
        if (query) {
            this.emit('StationCount', query);
        }
        else {
            this.emit('Speak','Please enter a valid location query');
        }
        /*
        let cityName;
        if (citySlot && citySlot.value) {
            cityName = citySlot.value;
        }*/
        /*let context = this;
        request('https://www.google.com', function(error, response, html){
            context.emit('Speak', cityName);
        })*/
    },
    'Speak': function (toSpeak){
        this.response.speak(toSpeak);
        this.emit(':responseReady');
    },
    'StationCount': function(query){
        let context = this;
        var url = 'http://www.massachusettsgasprices.com/GasPriceSearch.aspx?fuel=A&qsrch=';
        url = url + query;
        request(url,
            function (error, response, html) {
                var $ = cheerio.load(html);
                var stations = $("#pp_table tr[id]").map(
                    function(i){
                        var entry = {};
                        entry['price']=$(this).find('.price_num').text();
                        entry['name']=$(this).find('.address a').attr('href').split('/')[1].split('_').slice(0,-2).join(' ');
                        entry['address']=$(this).find('.address dd').text();
                        entry['area']=$(this).find('.p_area').text();
                        entry['cash']=$(this).find('.cash-icon').length>0;
                        return entry;
                    }
                ).get();

                /*stations.sort(
                    function(a,b) {
                        return a.price.localeCompare(b.price);
                    }
                );*/
                context.emit('Speak', 'I found '+stations.length+' results in '+query);
            }
        );
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = 'This is the Hello World Sample Skill. ';
        const reprompt = 'Say hello, to hear me speak.';

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('Goodbye!');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('See you later!');
        this.emit(':responseReady');
    }
};