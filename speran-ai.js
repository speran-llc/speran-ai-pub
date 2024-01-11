const API_URL_SEND = 'https://speran-ai-06e327aea366.herokuapp.com/sendMessage';

/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
*/

const USER_ID = generateUUID();

let HISTORY = [];

async function sendMessage(opts = {}) {

    let messages = HISTORY;

    let prompt = opts.prompt;

    messages.push({"role": "user", "content": prompt});

    log("prompt", prompt);

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
        messages.push({"role": "assistant", "content": responseText});
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

const submitMessage = function () {
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

            let yourMessage = message.replace(/\n/g, "<br>");

            $pr.scrollTop($pr.prop('scrollHeight'));

            $pr.html($pr.html() + `
                    <div class="py-2"><strong>You</strong></div>
                    <div class="mb-4">${yourMessage}</div>
                    <div class="py-2"><strong>ChatGPT</strong></div>
                `);

            return $pr.html();
        },
        onDataReceived: function (args) {
            let current = args.current;
            html = current + marked.parse(args.data);
            $pr.html(html);

            $main.scrollTop($main.prop('scrollHeight'));
        },
        onEnd: function () {
            let endText = `
                    <div class="mb-4"></div>
                    <hr />
                `;
            $pr.html($pr.html() + endText);
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

    let template = `
    <div class="main overflow-auto mb-auto d-flex flex-column">
        <div class="hero w-100 d-flex justify-content-center">
            <div class="text-background px-3 py-3 sai-content text-center">
                <h1 id="title" class="mb-0 text-center"></h1>
                <button id="start" class="btn btn-primary btn-lg my-3">Start</button>
            </div>
        </div>

        <div class="intro py-3 px-3 sai-content row g-0 w-100">
            <h2>How It Works</h2>
            <div class="col-12 p-3 my-2 border rounded">
                <h5><i class="fa-regular fa-comment-dots"></i> Answer</h5>
                ChatGPT will ask some questions to learn about your needs
            </div>
            <div class="col-12 p-3 my-2 border rounded">
                <h5><i class="fa-solid fa-glasses"></i> Evaluate</h5>
                You will then get a personalized recommendation
            </div>
            <div class="col-12 p-3 my-2 border rounded">
                <h5><i class="fa-solid fa-arrows-spin"></i> Refine</h5>
                Further improve the recommendation by answering additional questions
            </div>
        </div>

        <div class="promptResponse py-3 px-3 sai-content d-none fs-5"></div>
    </div>

    <div class="prompt mx-auto bg-dark px-3 py-3 w-100 d-none">
        <div class="textarea-container w-100">
<textarea name="text" id="text" class="w-100 pe-5 py-2 form-control" placeholder="Message ChatGPT..." rows="1" oninput="autoExpand(this)">
Help me find the perfect ${PRODUCT_STR}
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

    let $start = $hero.find("#start");
    $start.on("click", function () {
        // Only show the background image
        $hero.find(".text-background").addClass("d-none");

        // Hide the intro
        $intro.addClass("d-none");

        // Trigger the initial prompt
        $bs.trigger("click");

        // Show the chat box
        $prompt.removeClass("d-none");
    });

    $promptInput.keydown(function (event) {
        if (event.key == "Enter") { 
            event.preventDefault();
            submitMessage();
        }
    });

    $bs.on("click", function () {
        submitMessage();
    });

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find<br>the perfect ${PRODUCT_STR} for you`)
        .start();
});

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