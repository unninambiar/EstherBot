'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

var scriptRules = require('./script.json');
var question = '';
var reply = '';

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('Hi, I\'m Unni\'s Bot. I\'m learning how to handle some basic queries. Talk to me so I can learn what you want.  I\'m not too smart right now, but I\'ll try my best.')
                .then(() => 'askName');
        }
    },

    askName: {
        prompt: (bot) => bot.say('What\'s your name?'),
        receive: (bot, message) => {
            const name = message.text;
            return bot.setProp('name', name)
                .then(() => bot.say(`Great! I\'ll call you ${name}. Just say HELLO to get started.`))
                .then(() => 'speak');
        }
    },

    askQuestion: {
        prompt: (bot) => bot.say('Type in the message I should learn.'),
        receive: (bot, message) => {
            question = message.text.trim().toUpperCase();
            return Promise.resolve("askReply");
        }
    },

    askReply: {
        prompt: (bot) => bot.say('Type in the response I should learn for this message.'),
        receive: (bot, message) => {
            reply = message.text;
            const newRule = question + ': ' + reply;
            return bot.say(newRule)
                .then(() => bot.say('Great! I\'ll ask Unni to teach this to me. Thanks a lot.'))
                .then(() => 'speak');
        }
    },

    speak: {
        receive: (bot, message) => {

            let upperText = message.text.trim().toUpperCase();

            function updateSilent() {
                switch (upperText) {
                    case "CONNECT ME":
                        return bot.setProp("silent", true);
                    case "DISCONNECT":
                        return bot.setProp("silent", false);
                    default:
                        return Promise.resolve();
                }
            }

            function getSilent() {
                return bot.getProp("silent");
            }

            function processMessage(isSilent) {
                if (isSilent) {
                    return Promise.resolve("speak");
                }

                if (!_.has(scriptRules, upperText)) {
                    if (!_.find(scriptRules, function(rule) { return _.isEqual('Hello.*', upperText); })) {
                        return bot.say(`I haven\'t learnt how to respond to that yet.  Would you like to teach me?  %[Teach UnniBot](postback:teach)`)
                            .then(() => 'speak');
                    }
                }

                switch (upperText) {
                    case "RESTART":
                        return bot.say('Ok. Let\'s start again. Type anything to get me going.')
                            .then(() => 'start');
                    case "TEACH UNNIBOT":
                        return bot.say('Ok. Great! Let\'s get started.')
                            .then(() => 'askQuestion');
                    default:
                        break;
                }

                var response = scriptRules[upperText];
                var lines = response.split('\n');

                var p = Promise.resolve();
                _.each(lines, function(line) {
                    line = line.trim();
                    p = p.then(function() {
                        console.log(line);
                        return bot.say(line);
                    });
                })

                return p.then(() => 'speak');
            }

            return updateSilent()
                .then(getSilent)
                .then(processMessage);
        }
    }
});
