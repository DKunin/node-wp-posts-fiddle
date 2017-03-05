'use strict';

const Nightmare = require('nightmare');       

const { WP_SITE, WP_USERNAME, WP_PASSWORD } = process.env;

module.exports = function(postId, content) {
    return new Promise(function(resolve, reject){
        var nightmare = Nightmare({
            show: false,
            pollInterval: 50,
            typeInterval: 0
        });

        nightmare
            .goto(`${WP_SITE}/wp-admin/post.php?post=${postId}&action=edit`)
            .click('.jetpack-sso-toggle.wpcom')
            .insert('#user_login', WP_USERNAME)
            .insert('#user_pass', WP_PASSWORD)
            .click('#wp-submit')
            .wait('#post #_wpnonce')
            .evaluate(function () {
                document.querySelector('#content').value = '';
                return document.querySelector('#post #_wpnonce').value;
            })
            .insert('#content', content)
            .click('#publish')
            .wait('#post #_wpnonce')
            .end()
            .then(function (result) {
                resolve(result);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}