let gameTitle = "Maaya Shop Alerts";
let gameTheme = {};
let gameOptions = {};
let catalog = {};
let assetPath = "";
let pingInterval = null;
const NumFrames = 10;
let gameVolume = 0.5;

const socket = new ReconnectingWebSocket( "wss://fluffybunny.instafluff.tv", [], { debug: true } );

socket.addEventListener( "open", function ( event ) {
    // socket.send('Hello Server!');
    console.log( "open!" );
    if( pingInterval ) {
        clearInterval( pingInterval );
    }
    pingInterval = setInterval( () => {
        socket.send( JSON.stringify({
            type: "ping"
        }));
    }, 60000 * 5 ); // Ping every 5 mins
});

// Listen for messages
socket.addEventListener( "message", function ( event ) {
    let data = JSON.parse( event.data );
    if( data.type === "pong" ) {
        return;
    }
    if( data.data.type !== "paypal" ) {
        return;
    }
    console.log( data );
    if( data.data.channelname === "maayainsane" ) {
        if( data.data.items.length === 1 ) {
            showPayPalAlert( `${data.data.items[ 0 ]} for $${data.data.price}`, data.data.price );
        }
        else {
            showPayPalAlert( `${data.data.items.length} Items for $${data.data.price}`, data.data.price );
        }
    }
});

function setupGame( title, theme, options ) {
    gameTitle = title;
    gameTheme = theme;
    gameOptions = options;

    assetPath = gameTheme.path || "";

    gameVolume = gameOptions.volume === undefined || gameOptions.volume === null ? 0.5 : parseInt( gameOptions.volume ) / 100;
}
window.setupGame = setupGame;

window.WebFontConfig = {
    google: {
        families: [ "Nunito" ]
    },
    active() {
        CreateGame();
    },
};

/* eslint-disable */
// include the web-font loader script
(function() {
    const wf = document.createElement('script');
    wf.src = `${document.location.protocol === 'https:' ? 'https' : 'http'
    }://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js`;
    wf.type = 'text/javascript';
    wf.async = 'true';
    const s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
}());
/* eslint-enabled */

function Init() {
    // Add Initialization Here
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    Unicorn.Load( "alert_light", `web/alert1.png` );
    Unicorn.Load( "sfx_item", `web/Event13.mp3` );
    Unicorn.Load( "sfx_item_special", `web/Event18.mp3` );
    Unicorn.Load( "sfx_item_big", `web/slots_bigwin_001.mp3` );
}

let alertQueue = []; // TODO: Add alert queue
let itemCache = [];
let alertCounter = 0;
const framerate = 0.5 * 16 / 60;
const alertTime = 5.0;
function showPayPalAlert( message = "New PayPal Purchase!", amount = 10 ) {
    alertCounter++;
    const x = 100, y = -400;
    const alertId = alertCounter;
    let alertBG = Unicorn.AddBacklay( "alert_" + alertId, "alert_light", x, y, {
        // scale: { x: 3, y: 3 }
    } );

    let alertUpper = Unicorn.AddText( "alertupper_" + alertId, "New !shop order:", x + 20, y + 40, {
        fontFamily: 'Nunito',
        fontSize: 42,
        fontWeight: 'bold',
        fill: "#ffffff",
        lineJoin: "round",
    } );

    let alertText = Unicorn.AddText( "alerttext_" + alertId, message, x + 20, y + 100, {
        fontFamily: 'Nunito',
        fontSize: 42,
        fontWeight: 'bold',
        fill: "#ffffff",
        lineJoin: "round",
    } );


    // Center the text
    const alertWidth = 759 - 250;
    let textWidth = alertUpper.width + 10;
    alertUpper.position.x = x + 250 + ( alertWidth - textWidth ) / 2;
    if( alertText.width < alertWidth ) {
        alertText.position.x = x + 250 + ( alertWidth - alertText.width ) / 2;
    }
    else {
        // Adjust to fit the width
        let scale = alertWidth / alertText.width;
        alertText.scale.x = scale;
        alertText.scale.y = scale;
        alertText.position.x = x + 250;
    }

    alertQueue.push( {
        type: "paypal",
        elements: [ alertBG, alertUpper, alertText ],
        yOffsets: [ 0, 95, 155 ],
        time: alertTime,
        amount: amount,
        cleanup: () => {
            Unicorn.RemoveBacklay( "alert_" + alertId );
            Unicorn.RemoveText( "alertupper_" + alertId );
            Unicorn.RemoveText( "alerttext_" + alertId );
        }
    });
}

function Update( timestamp, timeDiffInMs ) {
    const timeDiff = timeDiffInMs / 1000;

    if( alertQueue.length > 0 ) {
        // Animate the top one
        if( alertQueue[ 0 ].time === alertTime ) {
            // Play sound
            switch( alertQueue[ 0 ].type ) {
            case "paypal":
                if( alertQueue[ 0 ].amount >= 400 ) {
                    Unicorn.PlaySound( "sfx_item_big", {
                        volume: gameVolume
                    } );
                }
                else if( alertQueue[ 0 ].amount >= 100 ) {
                    Unicorn.PlaySound( "sfx_item_special", {
                        volume: gameVolume * 2
                    } );
                }
                else {
                    Unicorn.PlaySound( "sfx_item", {
                        volume: gameVolume
                    } );
                }
                break;
            }
        }
        alertQueue[ 0 ].time -= timeDiff;
        if( alertQueue[ 0 ].time <= 0 ) {
            let item = alertQueue.shift();
            item.cleanup();
        }
        else {
            const offset = Math.min( 500, 1200 * Math.sin( Math.PI * alertQueue[ 0 ].time / alertTime ) );
            alertQueue[ 0 ].elements.forEach( ( e, i ) => {
                e.position.y = -400 + alertQueue[ 0 ].yOffsets[ i ] + offset;
            });
        }
    }
}

async function OnChatCommand( user, command, message, flags, extra ) {
    if( ( flags.broadcaster || flags.mod ) &&
    	( command === "resetpaypalalert" ) ) {
    	location.reload();
    }
	if( ( flags.broadcaster || flags.mod ) &&
        ( command === "testpaypallong" ) ) {
        showPayPalAlert( "SUPER DUPER LONG NAME Maaya Print (A100)" );
    }
    if( ( flags.broadcaster || flags.mod ) &&
        ( command === "testallprints" ) ) {
        showPayPalAlert( "ALL PRINTS (A5)", 600 );
    }
    if( ( flags.broadcaster || flags.mod ) &&
        ( command === "testpaypal" ) ) {
        showPayPalAlert( `WOW for $${message}`, parseInt( message || 10 ) );
    }
}

let messageCounter = 0;

function OnChatMessage( user, message, flags, self, extra ) {
}

function getRandomInt( num ) {
    return Math.floor( num * Math.random() );
}

async function validateTwitchToken( token ) {
    return await fetch( "https://id.twitch.tv/oauth2/validate", {
        headers: {
            Authorization: `OAuth ${token}`
        }
    } )
    .then( r => r.json() )
    .catch( error => {
        // Auth Failed
        return {
            error: error
        };
    });
}

let clientId = "";

async function CreateGame() {
	try {
        Unicorn.Create( "unicorn-display", {
            width: 1920,
            height: 1080,
            // background: "#777777",// "transparent",
            background: "transparent",
            init: Init,
            update: Update,
            channel: gameOptions.channel,
            username: gameOptions.oauth ? gameOptions.channel : undefined,
            password: gameOptions.oauth ? gameOptions.oauth.replace( "oauth:", "" ) : undefined,
            onCommand: OnChatCommand,
            onChat: OnChatMessage,
            gravity: { x: 0, y: 0 }
        });
        ComfyJS.onConnected = async ( address, port, isFirstConnect ) => {
            if( isFirstConnect ) {
                if( gameOptions.oauth ) {
                    // Validate and check expiration
                    let result = await validateTwitchToken( gameOptions.oauth.replace( "oauth:", "" ) );
                    clientId = result.client_id;
                    if( ![ "user:read:email", "chat:read", "chat:edit", "channel:manage:redemptions", "channel:read:redemptions" ].every( v => result.scopes.includes( v ) ) ) {
                        console.log( "Need more permissions" );
                    }
                    if( result.expires_in < 60 * 30 ) {
                        // Will expire in 30 days. Need to generate a new link!
                        console.log( "Token expires soon. Need to generate new link" );
                    }
                }
            }
        };
    }
    catch( err ) {
        console.log( err );
    }
}

window.setupGame = setupGame;
