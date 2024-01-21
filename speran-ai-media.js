const API_URL_SEND = 'https://speran-ai-06e327aea366.herokuapp.com/media/sendMessage';
/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
*/

const USER_ID = generateUUID();

const AFFILIATE_LINKS = getAffiliateLinks();

let HISTORY = [];

async function sendMessage(opts = {}) {

    let messages = HISTORY;

    let prompt = opts.prompt;

    messages.push({ "role": "user", "content": prompt });

    const requestBody = {
        messages: messages,
        productStr: PRODUCT_STR,
        productsStr: PRODUCTS_STR,
        userId: USER_ID
    };

    let current = opts.onStart();

    try {
        const response = await fetch(API_URL_SEND, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let responseText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });

            responseText += chunk;

            opts.onDataReceived({ data: responseText, current: current });
        }
        messages.push({ "role": "assistant", "content": responseText });
        opts.onEnd();
    } catch (err) {
        console.log("error", err);
        opts.onError({ current: current });
    }
}

const log = function () {
    if (window.location.hostname === 'cdpn.io') {
        console.log.apply(console, arguments);
    }
};

const calculateAppHeight = function () {
    let $app = $("#app");
    let viewportHeight = window.innerHeight - $app.offset().top;
    // Set viewport height based on where the app is located on the screen
    $app.css("height", `${viewportHeight}px`);
};

const submitMessage = function (opts = {}) {
    let $app = $("#app");
    let $main = $app.find(".main");
    let $hero = $app.find(".hero");
    let $intro = $app.find(".intro");
    let $prompt = $app.find(".prompt");
    let $promptInput = $prompt.find("textarea");
    let $bs = $prompt.find("button.sendMessage");
    let $pr = $app.find(".promptResponse");

    let origTxt = $bs.html();
    $bs.html(`<i class="fa fa-spinner fa-spin fa-xs"></i>`).prop("disabled", true);

    let message = $prompt.find("textarea").val();

    // Reset prompt
    $promptInput.val("");

    // Reset height of textarea
    $promptInput.removeClass("expanded");

    // Hide intro
    $intro.addClass("d-none");

    // Show prompt response
    $pr.removeClass("d-none");

    sendMessage({
        prompt: message,
        onStart: function (args) {

            $pr.scrollTop($pr.prop('scrollHeight'));

            let html = $pr.html();

            if (opts.hideMessage !== true) {
                let yourMessage = message.replace(/\n/g, "<br>");
                html += `
                    <div class="py-2"><strong>You</strong></div>
                    <div class="mb-4">${yourMessage}</div>
                `;
            }

            html += `
                <div class="py-2"><strong>ChatGPT</strong></div>
            `;

            $pr.html(html);

            return $pr.html();
        },
        onDataReceived: function (args) {
            let current = args.current;
            html = current + args.data;
            html = replaceLinksWithAffiliateLinks(html, AFFILIATE_LINKS);

            html = html + `<i class="fa-solid fa-spinner fa-spin fa-sm indicator ms-1"></i>`;

            $pr.html(html);

            $main.scrollTop($main.prop('scrollHeight'));
        },
        onEnd: function () {
            let endText = `
                    <div class="mb-4"></div>
                    <hr />
                `;
            let html = $pr.html() + endText;
            $pr.html(html);

            $pr.find(".indicator").remove();

            $pr.scrollTop($pr.prop('scrollHeight'));

            // Reset button
            $bs.html(origTxt);
            $bs.prop("disabled", false);
        },
        onError: function (args) {
            let endText = `
                    <div class="mb-4">Sorry, there was an error. Please try again later.</div>
                    <hr />
                `;
            $pr.html($pr.html() + endText);

            // Reset button
            $bs.html(origTxt);
            $bs.prop("disabled", false);
        }
    });
};

$(document).ready(function () {

    let $app = $("#app");

    $app.addClass("bg-light d-flex flex-column mx-auto");

    $(window).on('load', calculateAppHeight);

    let placeholders = {
        "romance books": {
            "elements": "ex. Regular FMC who is not attractive according to conventional standards but is desired and obsessed completely by the MMC. Not an instant attraction, but rather he has a reason why he was attracted to her at first. He should be absolutely obsessed with her.",
            "favorites": "ex. Fourth Wing, 50 Shades of Gray, Outlander, The Notebook "
        }
    }

    let elements = "";
    let favorites = "";
    if (placeholders[PRODUCTS_STR]) {
        elements = placeholders[PRODUCTS_STR]["elements"];
        favorites = placeholders[PRODUCTS_STR]["favorites"];
    }

    let template = `
    <div class="main overflow-auto mb-auto d-flex flex-column">
        <div class="hero w-100 d-flex justify-content-center">
            <div class="text-background p-3 sai-content text-center">
                <h1 id="title" class="mb-0 text-center"></h1>
            </div>
        </div>

        <div class="intro py-3 px-3 sai-content row g-0 w-100">
            
            <h2 id="getStarted">Recommendations are better with AI</h2>

            <div class="col-12 p-3 my-2 border rounded bg-white">By enabling you to articulate your preferences in great detail and nuance, ChatGPT gains a deeper understanding of your tastes.</div>
            <div class="col-12 p-3 my-2 border rounded bg-white">Utilizing this insight, it sifts through its vast database to find the perfect ${PRODUCT_STR} for you.</div>

            <div class="col-12 p-2 mb-3 text-center">
                <button id="introStart" class="btn btn-primary btn-lg mx-auto">Start</button>
            </div>

            <img src="https://assets.codepen.io/624108/powered-by-openai-badge-filled-on-light.svg" alt="" class="mx-auto mb-5" style="width: 150px" />

            <h2 id="sharePreferences" class="pt-3">Share your preferences</h2>

            <div id="elementsContainer" class="col-12 py-2 mb-2">
                <h6 class="mb-0">Describe in detail what you like and don't like</h6>
                <small>(optional)</small>
                <textarea id="elements" class="w-100" rows="6" placeholder="${elements}"></textarea>
            </div>
            <div class="col-12 py-2 mb-2">
                <h6 class="mb-0">List a few of your favorite romance novels</h6>
                <small>(optional)</small>
                <textarea id="favorites" type="text" name="favorites" class="w-100" placeholder="${favorites}"></textarea>
            </div>

            <div class="col-12 p-2 mb-2 text-center">
                <button id="start" class="btn btn-primary mx-auto">Get recommendation from ChatGPT</button>
            </div>

            <div class="col-12 p-3 my-2 border rounded" style="font-size: 12px">
                Every recommendation is independently made by ChatGPT. Things you buy through our links may earn us a commission.
            </div>


            <h2 class="mt-5">How It Works</h2>

            <div class="col-12 p-3 my-2 border rounded bg-white">
                <h5><i class="fa-regular fa-comment-dots"></i> Answer</h5>
                Answer a few questions about your preferences
            </div>
            <div class="col-12 p-3 my-2 border rounded bg-white">
                <h5><i class="fa-solid fa-glasses"></i> Evaluate</h5>
                ChatGPT will provide you with a personalized recommendation
            </div>
            <div class="col-12 p-3 my-2 border rounded bg-white">
                <h5><i class="fa-solid fa-arrows-spin"></i> Refine</h5>
                Further improve the recommendation by answering additional questions
            </div>

            <h2 class="mt-5">What is ChatGPT?</h2>
            
            <div class="col-12 p-3 my-2 border rounded bg-white">
                <div class="text-center">
                    <img src="https://assets.codepen.io/624108/openai-lockup.svg" alt="" class="mx-auto mb-3" style="width: 100px" />
                </div>
                <p>ChatGPT, developed by OpenAI (co-founded by Elon Musk and others), is an advanced AI chatbot.</p>
                <p>Leveraging natural language processing, it generates human-like conversational dialogue.</p>
                <p>Equipped with a vast knowledge base, ChatGPT assists users across a diverse range of tasks, blending technological innovation with practical utility.</p>
            </div>
        </div>

        <div class="promptResponse py-3 px-3 sai-content d-none" style="font-size: 1rem !important"></div>
    </div>

    <div class="prompt mx-auto bg-dark px-3 py-3 w-100 d-none">
        <div class="textarea-container w-100">
<textarea name="text" id="text" class="w-100 pe-5 py-2 form-control" placeholder="Message ChatGPT..." rows="1" oninput="autoExpand(this)">
</textarea>
            <button type="button" class="btn btn-primary btn-sm sendMessage"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    </div>
    `;

    $app.append(template)

    let $main = $app.find(".main");
    let $hero = $app.find(".hero");
    let $intro = $app.find(".intro");
    let $prompt = $app.find(".prompt");
    let $promptInput = $prompt.find("textarea");
    let $bs = $prompt.find("button.sendMessage");
    let $pr = $app.find(".promptResponse");

    let $introStart = $app.find("#introStart");
    $introStart.on("click", function () {
        let $sp = $("#sharePreferences");
        $main.animate({
            scrollTop: $sp.offset().top
        }, 500); 
    })

    let $start = $app.find("#start");
    $start.on("click", function () {
        // Only show the background image
        $hero.find(".text-background").addClass("d-none");

        // Hide the intro
        $intro.addClass("d-none");

        let elements = "";
        let favorites = "";

        let elementsInput = $("#elements").val().trim();
        let favoritesInput = $("#favorites").val().trim();

        if (elementsInput.length > 0) {
            elements = `The elements I care most about in a ${PRODUCT_STR} are: ${elementsInput}.`
        }
        
        if (favoritesInput.length > 0) {
            favorites = `My favorite ${PRODUCTS_STR} are: ${favoritesInput}.`
        }

        let promptText = `Help me find the perfect ${PRODUCT_STR}.${elements}${favorites}`;

        $promptInput.val(promptText);

        // Trigger the initial prompt
        $bs.trigger("click", [{ hideMessage: true }]);

        // Show the chat box
        $prompt.removeClass("d-none");
    });

    $promptInput.keydown(function (event) {
        if (event.key == "Enter") {
            event.preventDefault();
            submitMessage();
        }
    });

    $bs.on("click", function (event, arg1) {
        submitMessage(arg1);
    });

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find<br>the perfect ${PRODUCT_STR} for you`)
        .start();
});

function replaceLinksWithAffiliateLinks(inputString, urlMappings) {
    // Regular expression to match URLs
    const urlRegex = /https:\/\/www\.google\.com\/search\?[^\s]+/i;

    let $html = $("<div>" + inputString + "</div>");
    $html.find('a').each(function () {
        var $link = $(this);
        let url = $link.attr("href");

        // Sometimes getting undefined for some reason
        if (url) {
            url = url.replace(/\+/g, "%20");
            url = url.toLowerCase();
            if (urlMappings.hasOwnProperty(url)) {
                // Replace with the URL from the JSON object
                let affUrl = urlMappings[url].affiliate_url;
                $link.attr("href", affUrl);
                $link.addClass("affiliateLink");
            }
        }
    });
    return $html.prop("innerHTML");
}

function autoExpand(textarea) {
    // Reset the height to ensure the scroll height calculation is correct
    textarea.style.height = 'auto';

    // Set the height to the scroll height, which represents the height of the content
    textarea.style.height = textarea.scrollHeight + 'px';
}

function generateUUID() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); // use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getAffiliateLinks() {
    return {
        "https://www.google.com/search?q=outlander%20romance%20book": "https://amzn.to/48B0yDz",
        "https://www.google.com/search?q=the%20hating%20game%20romance%20book": "https://amzn.to/48zznJo",
        "https://www.google.com/search?q=dark%20lover%20romance%20book": "https://amzn.to/3Su3H2F",
        "https://www.google.com/search?q=bared%20to%20you%20romance%20book": "https://amzn.to/47Gk68g",
        "https://www.google.com/search?q=pride%20and%20prejudice%20romance%20book": "https://amzn.to/3O192eY",
        "https://www.google.com/search?q=dead%20until%20dark%20romance%20book": "https://amzn.to/4224SJt",
        "https://www.google.com/search?q=the%20rosie%20project%20romance%20book": "https://amzn.to/48CMsBO",
        "https://www.google.com/search?q=the%20notebook%20romance%20book": "https://amzn.to/3vHuak7",
        "https://www.google.com/search?q=a%20court%20of%20thorns%20and%20roses%20romance%20book": "https://amzn.to/3vH3O1E",
        "https://www.google.com/search?q=me%20before%20you%20romance%20book": "https://amzn.to/48EZ3En",
        "https://www.google.com/search?q=the%20unhoneymooners%20romance%20book": "https://amzn.to/3S7Ulbr",
        "https://www.google.com/search?q=the%20bronze%20horseman%20romance%20book": "https://amzn.to/3S7TKq8",
        "https://www.google.com/search?q=the%20unwanted%20wife%20romance%20book": "https://amzn.to/48HDtzk",
        "https://www.google.com/search?q=the%20duke%20and%20i%20romance%20book": "https://amzn.to/3HrEiQw",
        "https://www.google.com/search?q=slave%20to%20sensation%20romance%20book": "https://amzn.to/426Bx0P",
        "https://www.google.com/search?q=dragon%20bound%20romance%20book": "https://amzn.to/3OwFC91",
        "https://www.google.com/search?q=when%20he%20was%20wicked%20romance%20book": "https://amzn.to/48zr8wS",
        "https://www.google.com/search?q=unleashed%20romance%20book": "https://amzn.to/47JCQUi",
        "https://www.google.com/search?q=to%20beguile%20a%20beast%20romance%20book": "https://amzn.to/3vHsur3",
        "https://www.google.com/search?q=halfway%20to%20the%20grave%20romance%20book": "https://amzn.to/48WlVPy",
        "https://www.google.com/search?q=dark%20desire%20romance%20book": "https://amzn.to/3UdEASC",
        "https://www.google.com/search?q=the%20night%20circus%20romance%20book": "https://amzn.to/3S2OYKl",
        "https://www.google.com/search?q=hush%2c%20hush%20romance%20book": "https://amzn.to/490mvMg",
        "https://www.google.com/search?q=the%20kiss%20quotient%20romance%20book": "https://amzn.to/3HJXJ7D",
        "https://www.google.com/search?q=attachments%20romance%20book": "https://amzn.to/4b3KUCj",
        "https://www.google.com/search?q=the%20flatshare%20romance%20book": "https://amzn.to/3vHuCPl",
        "https://www.google.com/search?q=%22bared%20to%20you%22%20romance%20book": "https://amzn.to/4bdZJ5w",
        "https://www.google.com/search?q=the%20siren%20romance%20book": "https://amzn.to/4b0hO6R",
        "https://www.google.com/search?q=sweet%20addiction%20romance%20book": "https://amzn.to/47BAVRS",
        "https://www.google.com/search?q=shelter%20for%20blythe%20romance%20book": "https://amzn.to/3u4OsU8",
        "https://www.google.com/search?q=the%20fault%20in%20our%20stars%20romance%20book": "https://amzn.to/3vIHHrP",
        "https://www.google.com/search?q=eleanor%20%26%20park%20romance%20book": "https://amzn.to/3vIHIfn",
        "https://www.google.com/search?query=bared%20to%20you%20romance%20book": "https://amzn.to/3vHsLKB",
        "https://www.google.com/search?q=beach%20read%20romance%20book": "https://amzn.to/421X4HP",
        "https://www.google.com/search?q=you%20deserve%20each%20other%20romance%20book": "https://amzn.to/421Ofhf",
        "https://www.google.com/search?q=bet%20me%20romance%20book": "https://amzn.to/426IMpj"
    };
}