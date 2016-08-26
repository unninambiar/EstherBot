'use strict';

const _ = require('lodash');
const Script = require('smooch-bot').Script;

var scriptRules = require('./script.json');

module.exports = new Script({
    processing: {
        //prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

    start: {
        receive: (bot) => {
            return bot.say('Hi, I\'m Unni\'s Bot. I\'m learning how to handle some basic queries. Talk to me so I can learn what you want.  I\'m not too smart right now, but I\'ll try my best.  What\'s your name?')
                .then(() => 'askName');
        }
    },

    askName: {
        //prompt: (bot) => bot.say('What\'s your name?'),
        receive: (bot, message) => {
            const name = message.text;
            return bot.setProp('name', name)
                .then(() => bot.say('Great! I\'ll call you ${name} Just say HELLO to get started.'))
                .then(() => 'speak');
        }
    },

    askQuestion: {
        prompt: (bot) => bot.say('Type in the message I should learn.'),
        receive: (bot, message) => {
            const question = message.text.trim().toUpperCase();
            return bot.setProp('question', question)
                .then(() => 'askResponse');
        }
    },

    askResponse: {
        prompt: (bot) => bot.say('Type in the response I should learn for this message.'),
        receive: (bot, message) => {
            const response = message.text;
            return bot.setProp('response', response)
                .then(() => bot.say('Great! I\'ve learnt it.  Try me. '))
//                .then(() => function(){scriptRules = _.concat(scriptRules, '${question}: ${response}');}
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

                if (bot.getProp("teach")) {
                    scriptRules = _.concat(scriptRules, '${question}: ${response}');
                    bot.setProp("teach", false);
                }

                if (!_.has(scriptRules, upperText)) {
                    return bot.say(`I haven\'t learnt how to respond to that yet.  Would you like to teach me?  %[Teach UnniBot](postback:teach)`)
                        .then(() => 'speak');
                }

                switch (upperText) {
                    case "RESTART":
                        return bot.say('Ok. Let\'s start again.')
                            .then(() => 'start');
                    case "TEACH UNNIBOT":
                        return bot.setProp("teach", true)
                            .then(() => bot.say('Ok. Great! Let\'s get started.'))
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
