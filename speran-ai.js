const API_URL_SEND = 'https://speran-ai-06e327aea366.herokuapp.com/sendMessage';

/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
*/

const QUESTIONS_LIST = getQuestionsList(PRODUCT_STR);

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

const renderMessageHelpers = function (opts = {}) {

    let ql = QUESTIONS_LIST;

    let $app = $('#app');
    let $mh = $app.find(".messageHelpers");
    let $h = $mh.find(".helpers");

    for (let i = 0; i < ql.questions.length; i++) {
        let q = ql.questions[i];
        renderQuestion({ $root: $h, questionsList: ql, question: q, index: i });
    }

    return $mh;
};

const renderQuestion = function (opts = {}) {

    let ql = opts.questionsList;

    let ci = opts.index;

    let q = opts.question;

    let $qs = opts.$root;

    let id = `question-${ci}`;
    let $obj = $(`#${id}`);

    let $app = $("#app");

    let questionNum = ci + 1;
    let lastStepNum = ql.questions.length;

    let template = `
        <div id="${id}" data-id="${ci}" class="question my-5">
            <div class="stepNum text-secondary">${questionNum} of ${lastStepNum}</div>
            <h5 class="questionText">${q.text}</h5>
            <div class="options my-3"></div>
        </div>
        `;
    $obj = $(template);

    $qs.append($obj);

    let $ds = $obj.find('.options');
    for (let i = 0; i < q.options.length; i++) {
        let option = q.options[i];
        let inputId = `${id}_option[${i}]`;
        let d = `
        <div class="option my-2 p-3 cbx-container d-flex align-middle">
            ${option}
        </div>
      `;
        let $d = $(d);
        $ds.append($d);
    }

    let $p = $app.find(".prompt");
    let $btn = $p.find("button.togglePrompt");
    let $pt = $p.find("textarea");

    // Check the checkbox when user clicks on option
    $obj.find('.cbx-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);

        // Toggle the checkbox
        let $parent = $target.closest(".cbx-container");
        let $cbx = $parent.find('input[type="checkbox"]');

        let checked = $cbx.prop('checked');

        if (!$target.is('input[type="checkbox"]')) {
            $cbx.prop('checked', !checked);
        }

        let text = $pt.val();
        let val = $cbx.val();

        let valText = val + "\n";
        if (!checked) {
            text = text.replace(valText, "");
            text = text + valText;
        } else {
            text = text.replace(valText, "");
        }
        $pt.val(text);

        // Scroll textarea to bottom
        $pt.scrollTop($pt.prop('scrollHeight'));

        // Expand textarea
        $pt.addClass("expanded");
        $btn.html(`<i class="fa fa-solid fa-chevron-down text-light"></i>`);
    });

    return $obj;
}

const calculateAppHeight = function () {
    let $app = $("#app");
    let viewportHeight = window.innerHeight - $app.offset().top;
    // Set viewport height based on where the app is located on the screen
    $app.css("height", `${viewportHeight}px`);
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

        <div class="messageHelpers py-3 px-3 sai-content d-none">
            <h1>Add Requirements</h1>
            <p>Click to add and once more to remove - add as many as you want.</p>
            <div class="helpers"></div>
        </div>

        <div class="promptResponse py-3 px-3 sai-content d-none fs-5"></div>
    </div>

    <div class="prompt mx-auto bg-dark px-3 py-3 w-100 d-none">
        <div class="d-grid gap-2 d-none">
            <button type="button" class="togglePrompt btn-sm btn">
                <i class="fa fa-solid fa-chevron-up text-light"></i>
            </button>
        </div>
        <div class="textarea-container w-100">
<textarea name="text" id="text" class="w-100 pe-5 py-2 form-control" placeholder="Message ChatGPT..." rows="1" oninput="autoExpand(this)">
Help me find the right ${PRODUCT_STR}
</textarea>
            <button type="button" class="btn btn-primary btn-sm sendMessage"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
        <div class="promptHelp d-flex align-items-center d-none">
            <button type="button" class="btn btn-secondary btn-sm viewMessageHelpers"><i class="fa-solid fa-plus fa-xs"></i></button>
            <div class="text-white-50 ms-2 fs-6">Add requirements</div>
        </div>
    </div>
    `;

    $app.append(template)

    let $main = $app.find(".main");
    let $hero = $app.find(".hero");
    let $intro = $app.find(".intro");
    let $prompt = $app.find(".prompt");
    let $tp = $prompt.find(".togglePrompt");
    let $promptInput = $prompt.find("textarea");
    let $bs = $prompt.find("button.sendMessage");
    let $pr = $app.find(".promptResponse");
    let $promptHelp = $app.find(".promptHelp");
    let $mh = $app.find(".messageHelpers");
    let $vmh = $promptHelp.find("button.viewMessageHelpers");

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

    $bs.on("click", function () {

        let origTxt = $bs.html();
        $bs.html(`<i class="fa fa-spinner fa-spin fa-xs"></i>`).prop("disabled", true);

        let message = $prompt.find("textarea").val();

        // Reset prompt
        $tp.html(`<i class="fa fa-solid fa-chevron-up text-light"></i>`);
        $promptInput.val("");

        // Reset height of textarea
        $promptInput.removeClass("expanded");

        // Hide intro
        $intro.addClass("d-none");

        // Show prompt response
        $pr.removeClass("d-none");

        // Hide message helpers
        $mh.addClass("d-none");
        $vmh.html(`<i class="fa fa-solid fa-plus fa-xs"></i>`);

        // Reset all checkboxes
        $app.find("input").prop("checked", false);

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

                // Re-enable message helper
                $vmh.prop("disabled", false);
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

                // Re-enable message helper
                $vmh.prop("disabled", false);
            }
        });

    });

    $vmh.on("click", function (event) {
        let $messageHelpers = $app.find(".messageHelpers");

        let hidden = $messageHelpers.hasClass("d-none");
        if (hidden) {
            $vmh.html(`<i class="fa fa-solid fa-minus fa-xs"></i>`);
            $pr.addClass("d-none");
        } else {
            $vmh.html(`<i class="fa fa-solid fa-plus fa-xs"></i>`);
            $pr.removeClass("d-none");
        }

        $messageHelpers.toggleClass("d-none");

        $main.scrollTop($messageHelpers.position().top);
    });

    $tp.on("click", function () {
        let expanded = $promptInput.hasClass("expanded");
        if (expanded) {
            $promptInput.removeClass("expanded");
            $tp.html(`<i class="fa fa-solid fa-chevron-up text-light"></i>`);
        } else {
            $promptInput.addClass("expanded");
            $tp.html(`<i class="fa fa-solid fa-chevron-down text-light"></i>`);
        }
    });

    renderMessageHelpers();

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find<br>the right ${PRODUCT_STR} for you`)
        .start();
});

function autoExpand(textarea) {
    // Reset the height to ensure the scroll height calculation is correct
    textarea.style.height = 'auto';

    // Set the height to the scroll height, which represents the height of the content
    textarea.style.height = textarea.scrollHeight + 'px';
}

function getQuestionsList(key) {
    const ql = {
        "travel backpack":
        {
            "questions": [
                {
                    "text": "What is your primary use for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='use' value='My primary use for the travel backpack is for hiking and outdoor adventures.'> For hiking and outdoor adventures",
                        "<input type='checkbox' name='use' value='My primary use for the travel backpack is for traveling and tourism.'>For traveling and tourism",
                        "<input type='checkbox' name='use' value='My primary use for the travel backpack is for professional work or school.'> For professional work or school",
                        "<input type='checkbox' name='use' value='My primary use for the travel backpack is for daily commuting.'> For daily commuting"
                    ]
                },
                {
                    "text": "What is your preferred size for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='size' value='My preferred size for the travel backpack is small.'> Small",
                        "<input type='checkbox' name='size' value='My preferred size for the travel backpack is medium.'> Medium",
                        "<input type='checkbox' name='size' value='My preferred size for the travel backpack is large.'> Large"
                    ]
                },
                {
                    "text": "What is your preferred color for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='color' value='My preferred color for the travel backpack is black.'> Black",
                        "<input type='checkbox' name='color' value='My preferred color for the travel backpack is blue.'> Blue",
                        "<input type='checkbox' name='color' value='My preferred color for the travel backpack is red.'> Red",
                        "<input type='checkbox' name='color' value='My preferred color for the travel backpack is grey.'> Grey"
                    ]
                },
                {
                    "text": "How much weight are you planning to carry in the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='weight' value='I am planning to carry light weight in the travel backpack.'> Light weight",
                        "<input type='checkbox' name='weight' value='I am planning to carry moderate weight in the travel backpack.'> Moderate weight",
                        "<input type='checkbox' name='weight' value='I am planning to carry heavy weight in the travel backpack.'> Heavy weight"
                    ]
                },
                {
                    "text": "What is your budget for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='budget' value='My budget for the travel backpack is under $50.'> Under $50",
                        "<input type='checkbox' name='budget' value='My budget for the travel backpack is between $50 and $100.'> Between $50 and $100",
                        "<input type='checkbox' name='budget' value='My budget for the travel backpack is over $100.'> Over $100"
                    ]
                },
                {
                    "text": "Do you have any specific brand preferences for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='brand' value='I have specific brand preferences for the travel backpack.'> Yes, I have specific brand preferences",
                        "<input type='checkbox' name='brand' value='I do not have specific brand preferences for the travel backpack.'> No, I do not have specific brand preferences"
                    ]
                },
                {
                    "text": "Do you prefer a particular material for the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='material' value='I prefer nylon for the travel backpack.'> Nylon",
                        "<input type='checkbox' name='material' value='I prefer leather for the travel backpack.'> Leather",
                        "<input type='checkbox' name='material' value='I prefer canvas for the travel backpack.'> Canvas",
                        "<input type='checkbox' name='material' value='I do not prefer a particular material for the travel backpack.'> I do not have a preference"
                    ]
                },
                {
                    "text": "Do you prefer a hard-shell or a soft-shell travel backpack?",
                    "options": [
                        "<input type='checkbox' name='shell' value='I prefer a hard-shell travel backpack.'> Hard-shell",
                        "<input type='checkbox' name='shell' value='I prefer a soft-shell travel backpack.'> Soft-shell"
                    ]
                },
                {
                    "text": "Do you need any specific features in your travel backpack like a laptop compartment, wheels or a rain cover?",
                    "options": [
                        "<input type='checkbox' name='features' value='I need specific features in my travel backpack such as a laptop compartment.'> Laptop compartment",
                        "<input type='checkbox' name='features' value='I need specific features in my travel backpack such as wheels.'> Wheels",
                        "<input type='checkbox' name='features' value='I need specific features in my travel backpack such as a rain cover.'> Rain cover",
                        "<input type='checkbox' name='features' value='I do not need any specific features in my travel backpack.'> I do not need any specific features"
                    ]
                },
                {
                    "text": "Do you prefer a travel backpack with a specific number of compartments?",
                    "options": [
                        "<input type='checkbox' name='compartments' value='I prefer a travel backpack with a single large compartment.'> Single large compartment",
                        "<input type='checkbox' name='compartments' value='I prefer a travel backpack with multiple small compartments.'> Multiple small compartments",
                        "<input type='checkbox' name='compartments' value='I do not have a preference for the number of compartments in the travel backpack.'> I do not have a preference"
                    ]
                },
                {
                    "text": "Does the design of the travel backpack matter to you?",
                    "options": [
                        "<input type='checkbox' name='design' value='The design of the travel backpack matters to me.'> Yes, design matters",
                        "<input type='checkbox' name='design' value='The design of the travel backpack does not matter to me.'> No, design does not matter"
                    ]
                },
                {
                    "text": "Are you looking for a travel backpack that can be used for multi-day trips?",
                    "options": [
                        "<input type='checkbox' name='trips' value='I am looking for a travel backpack that can be used for multi-day trips.'> Yes, for multi-day trips",
                        "<input type='checkbox' name='trips' value='I am not looking for a travel backpack that can be used for multi-day trips.'> No, not for multi-day trips"
                    ]
                },
                {
                    "text": "Do you need a waterproof travel backpack?",
                    "options": [
                        "<input type='checkbox' name='waterproof' value='I need a waterproof travel backpack.'> Yes, waterproof",
                        "<input type='checkbox' name='waterproof' value='I do not need a waterproof travel backpack.'> No, not waterproof"
                    ]
                },
                {
                    "text": "Are you going to carry electronics in your travel backpack?",
                    "options": [
                        "<input type='checkbox' name='electronics' value='I am going to carry electronics in my travel backpack.'> Yes, carry electronics",
                        "<input type='checkbox' name='electronics' value='I am not going to carry electronics in my travel backpack.'> No, not carry electronics"
                    ]
                },
                {
                    "text": "Do you prefer a travel backpack with a certain type of closure system?",
                    "options": [
                        "<input type='checkbox' name='closure' value='I prefer a travel backpack with a zipper closure system.'> Zipper closure system",
                        "<input type='checkbox' name='closure' value='I prefer a travel backpack with a drawstring closure system.'> Drawstring closure system",
                        "<input type='checkbox' name='closure' value='I do not have a preference for the closure system of the travel backpack.'> No preference"
                    ]
                },
                {
                    "text": "Do you need a travel backpack that is suitable for air travel?",
                    "options": [
                        "<input type='checkbox' name='airTravel' value='I need a travel backpack that is suitable for air travel.'> Yes, suitable for air travel",
                        "<input type='checkbox' name='airTravel' value='I do not need a travel backpack that is suitable for air travel.'> No, not suitable for air travel"
                    ]
                },
                {
                    "text": "Do you have a preference for the design of the shoulder straps of the travel backpack?",
                    "options": [
                        "<input type='checkbox' name='shoulderStraps' value='I prefer padded shoulder straps on the travel backpack.'> Padded shoulder straps",
                        "<input type='checkbox' name='shoulderStraps' value='I prefer non-padded shoulder straps on the travel backpack.'> Non-padded shoulder straps",
                        "<input type='checkbox' name='shoulderStraps' value='I do not have a preference for the design of the shoulder straps.'> No preference"
                    ]
                },
                {
                    "text": "Do you want a travel backpack that comes with a warranty?",
                    "options": [
                        "<input type='checkbox' name='warranty' value='I want a travel backpack that comes with a warranty.'> Yes, with warranty",
                        "<input type='checkbox' name='warranty' value='I do not want a travel backpack that comes with a warranty.'> No, without warranty"
                    ]
                },
                {
                    "text": "Are you looking for a travel backpack that has security features like lockable zippers?",
                    "options": [
                        "<input type='checkbox' name='security' value='I am looking for a travel backpack that has security features like lockable zippers.'> Yes, with security features",
                        "<input type='checkbox' name='security' value='I am not looking for a travel backpack that has security features like lockable zippers.'> No, without security features"
                    ]
                },
                {
                    "text": "Are you interested in a convertible travel backpack that can be transformed into a briefcase or messenger bag?",
                    "options": [
                        "<input type='checkbox' name='convertible' value='I am interested in a convertible travel backpack.'> Yes, convertible",
                        "<input type='checkbox' name='convertible' value='I am not interested in a convertible travel backpack.'> No, not convertible"
                    ]
                }
            ]
        },
        "travel pillow":
        {
            "questions": [
                {
                    "text": "What is your primary purpose for buying the travel pillow?",
                    "options": [
                        "<input type='checkbox' value='My primary purpose for buying the travel pillow is for neck support.'> My primary purpose for buying the travel pillow is for neck support.<br/>",
                        "<input type='checkbox' value='My primary purpose for buying the travel pillow is for back support.'> My primary purpose for buying the travel pillows for back support.<br/>",
                        "<input type='checkbox' value='My primary purpose for buying the travel pillow is for comfort during travel.'> My primary purpose for buying the travel pillow is for comfort during travel.<br/>"
                    ]
                },
                {
                    "text": "What type of material do you prefer in a travel pillow?",
                    "options": [
                        "<input type='checkbox' value='I prefer memory foam in a travel pillow.'> I prefer memory foam in a travel pillow.<br/>",
                        "<input type='checkbox' value='I prefer synthetic fibers in a travel pillow.'> I prefer synthetic fibers in a travel pillow.<br/>",
                        "<input type='checkbox' value='I prefer natural fibers in a travel pillow.'> I prefer natural fibers in a travel pillow.<br/>"
                    ]
                },
                {
                    "text": "Which design of travel pillow do you prefer?",
                    "options": [
                        "<input type='checkbox' value='I prefer u-shaped design in a travel pillow.'> I prefer u-shaped design in a travel pillow.<br/>",
                        "<input type='checkbox' value='I prefer total wrap-around design in a travel pillow.'> I prefer total wrap-around design in a travel pillow.<br/>",
                        "<input type='checkbox' value='I prefer inflatable design in a travel pillow.'> I prefer inflatable design in a travel pillow.<br/>"
                    ]
                },
                {
                    "text": "Would you prefer a travel pillow with cooling technologies?",
                    "options": [
                        "<input type='checkbox' value='I would prefer a travel pillow with cooling technologies.'> I would prefer a travel pillow with cooling technologies.<br/>",
                        "<input type='checkbox' value='I would not prefer a travel pillow with cooling technologies.'> I would not prefer a travel pillow with cooling technologies.<br/>"
                    ]
                },
                {
                    "text": "Are you looking for a travel pillow that's hypoallergenic?",
                    "options": [
                        "<input type='checkbox' value=\"I am looking for a travel pillow that's hypoallergenic.\"> I am looking for a travel pillow that's hypoallergenic.<br/>",
                        "<input type='checkbox' value=\"I am not looking for a travel pillow that's hypoallergenic.\"> I am not looking for a travel pillow that's hypoallergenic.<br/>"
                    ]
                },
                {
                    "text": "Do you desire a travel pillow with a removable and washable cover?",
                    "options": [
                        "<input type='checkbox' value='I desire a travel pillow with a removable and washable cover.'> I desire a travel pillow with a removable and washable cover.<br/>",
                        "<input type='checkbox' value='I do not desire a travel pillow with a removable and washable cover.'> I do not desire a travel pillow with a removable and washable cover.<br/>"
                    ]
                },
                {
                    "text": "Are you interested in a travel pillow with an adjustable firmness?",
                    "options": [
                        "<input type='checkbox' value='I am interested in a travel pillow with an adjustable firmness.'> I am interested in a travel pillow with an adjustable firmness.<br/>",
                        "<input type='checkbox' value='I am not interested in a travel pillow with an adjustable firmness.'> I am not interested in a travel pillow with an adjustable firmness.<br/>"
                    ]
                },
                {
                    "text": "Does color of the travel pillow matter to you?",
                    "options": [
                        "<input type='checkbox' value='Color of the travel pillow does matter to me.'> Color of the travel pillow does matter to me.<br/>",
                        "<input type='checkbox' value='Color of the travel pillow does not matter to me.'> Color of the travel pillow does not matter to me.<br/>"
                    ]
                },
                {
                    "text": "Are you considering a travel pillow with a carrying case?",
                    "options": [
                        "<input type='checkbox' value='I am considering a travel pillow with a carrying case.'> I am considering a travel pillow with a carrying case.<br/>",
                        "<input type='checkbox' value='I am not considering a travel pillow with a carrying case.'> I am not considering a travel pillow with a carrying case.<br/>"
                    ]
                },
                {
                    "text": "Are you looking for a travel pillow with a built-in hood or eye mask?",
                    "options": [
                        "<input type='checkbox' value='I am looking for a travel pillow with a built-in hood or eye mask.'> I am looking for a travel pillow with a built-in hood or eye mask.<br/>",
                        "<input type='checkbox' value='I am not looking for a travel pillow with a built-in hood or eye mask.'> I am not looking for a travel pillow with a built-in hood or eye mask.<br/>"
                    ]
                },
                {
                    "text": "Would you prefer a travel pillow with a built-in speaker?",
                    "options": [
                        "<input type='checkbox' value='I would prefer a travel pillow with a built-in speaker.'> I would prefer a travel pillow with a built-in speaker.<br/>",
                        "<input type='checkbox' value='I would not prefer a travel pillow with a built-in speaker.'> I would not prefer a travel pillow with a built-in speaker.<br/>"
                    ]
                },
                {
                    "text": "Are you planning to use the travel pillow for long-distance flights or short car rides?",
                    "options": [
                        "<input type='checkbox' value='I am planning to use the travel pillow for long-distance flights.'> I am planning to use the travel pillow for long-distance flights.<br/>",
                        "<input type='checkbox' value='I am planning to use the travel pillow for short car rides.'> I am planning to use the travel pillow for short car rides.<br/>"
                    ]
                },
                {
                    "text": "Would you like your travel pillow to be small and compact or large for maximum comfort?",
                    "options": [
                        "<input type='checkbox' value='I would like my travel pillow to be small and compact.'> I would like my travel pillow to be small and compact.<br/>",
                        "<input type='checkbox' value='I would like my travel pillow to be large for maximum comfort.'> I would like my travel pillow to be large for maximum comfort.<br/>"
                    ]
                },
                {
                    "text": "Are you willing to pay extra for special features in a travel pillow?",
                    "options": [
                        "<input type='checkbox' value='I am willing to pay extra for special features in a travel pillow.'> I am willing to pay extra for special features in a travel pillow.<br/>",
                        "<input type='checkbox' value='I am not willing to pay extra for special features in a travel pillow.'> I am not willing to pay extra for special features in a travel pillow.<br/>"
                    ]
                },
                {
                    "text": "Do you want a travel pillow that is specifically designed for side sleepers?",
                    "options": [
                        "<input type='checkbox' value='I want a travel pillow that is specifically designed for side sleepers.'> I want a travel pillow that is specifically designed for side sleepers.<br/>",
                        "<input type='checkbox' value='I do not want a travel pillow that is specifically designed for side sleepers.'> I do not want a travel pillow that is specifically designed for side sleepers.<br/>"
                    ]
                },
                {
                    "text": "Do you prefer a firm or soft travel pillow?",
                    "options": [
                        "<input type='checkbox' value='I prefer a firm travel pillow.'> I prefer a firm travel pillow.<br/>",
                        "<input type='checkbox' value='I prefer a soft travel pillow.'> I prefer a soft travel pillow.<br/>"
                    ]
                },
                {
                    "text": "Would you like a travel pillow that has a strap to attach to luggage?",
                    "options": [
                        "<input type='checkbox' value='I would like a travel pillow that has a strap to attach to luggage.'> I would like a travel pillow that has a strap to attach to luggage.<br/>",
                        "<input type='checkbox' value='I would not like a travel pillow that has a strap to attach to luggage.'> I would not like a travel pillow that has a strap to attach to luggage.<br/>"
                    ]
                },
                {
                    "text": "Are you interested in a travel pillow that comes with ear plugs or an eye mask?",
                    "options": [
                        "<input type='checkbox' value='I am interested in a travel pillow that comes with ear plugs or an eye mask.'> I am interested in a travel pillow that comes with ear plugs or an eye mask.<br/>",
                        "<input type='checkbox' value='I am not interested in a travel pillow that comes with ear plugs or an eye mask.'> I am not interested in a travel pillow that comes with ear plugs or an eye mask.<br/>"
                    ]
                },
                {
                    "text": "Would a self-inflating travel pillow be of interest to you?",
                    "options": [
                        "<input type='checkbox' value='A self-inflating travel pillow would be of interest to me.'> A self-inflating travel pillow would be of interest to me.<br/>",
                        "<input type='checkbox' value='A self-inflating travel pillow would not be of interest to me.'> A self-inflating travel pillow would not be of interest to me.<br/>"
                    ]
                },
                {
                    "text": "Do you prefer a travel pillow that's easy to carry or one that provides the most support and comfort, irrespective of size?",
                    "options": [
                        "<input type='checkbox' value=\"I prefer a travel pillow that's easy to carry.\"> I prefer a travel pillow that's easy to carry.<br/>",
                        "<input type='checkbox' value='I prefer a travel pillow that provides the most support and comfort, irrespective of size.'> I prefer a travel pillow that provides the most support and comfort, irrespective of size.<br/>"
                    ]
                }
            ]
        },
        "fantasy fiction book":
        {
            "questions": [
                {
                    "text": "Which genre of fantasy fiction book are you particularly interested in?",
                    "options": [
                        "<input type=\"checkbox\" name=\"genre\" value=\"I am particularly interested in epic fantasy genre.\"> I am particularly interested in epic fantasy genre.",
                        "<input type=\"checkbox\" name=\"genre\" value=\"I am particularly interested in urban fantasy genre.\"> I am particularly interested in urban fantasy genre.",
                        "<input type=\"checkbox\" name=\"genre\" value=\"I am particularly interested in dark fantasy genre.\"> I am particularly interested in dark fantasy genre."
                    ]
                },
                {
                    "text": "Are you looking for a fantasy fiction book by a specific author?",
                    "options": [
                        "<input type=\"checkbox\" name=\"author\" value=\"Yes, I am looking for a fantasy fiction book by a specific author.\"> Yes, I am looking for a fantasy fiction book by a specific author.",
                        "<input type=\"checkbox\" name=\"author\" value=\"No, I am not looking for a fantasy fiction book by a specific author.\"> No, I am not looking for a fantasy fiction book by a specific author."
                    ]
                },
                {
                    "text": "Do you prefer fantasy fiction book series or standalone novels?",
                    "options": [
                        "<input type=\"checkbox\" name=\"type\" value=\"I prefer fantasy fiction book series.\"> I prefer fantasy fiction book series.",
                        "<input type=\"checkbox\" name=\"type\" value=\"I prefer standalone fantasy fiction novels.\"> I prefer standalone fantasy fiction novels."
                    ]
                },
                {
                    "text": "Are you interested in a fantasy fiction book with a particular setting, like historical or futuristic?",
                    "options": [
                        "<input type=\"checkbox\" name=\"setting\" value=\"Yes, I am interested in a fantasy fiction book with a historical setting.\"> Yes, I am interested in a fantasy fiction book with a historical setting.",
                        "<input type=\"checkbox\" name=\"setting\" value=\"Yes, I am interested in a fantasy fiction book with a futuristic setting.\"> Yes, I am interested in a fantasy fiction book with a futuristic setting.",
                        "<input type=\"checkbox\" name=\"setting\" value=\"No, I don't have a particular setting in mind.\"> No, I don't have a particular setting in mind."
                    ]
                },
                {
                    "text": "What age group is the fantasy fiction book for?",
                    "options": [
                        "<input type=\"checkbox\" name=\"age\" value=\"The fantasy fiction book is for children.\"> The fantasy fiction book is for children.",
                        "<input type=\"checkbox\" name=\"age\" value=\"The fantasy fiction book is for young adults.\"> The fantasy fiction book is for young adults.",
                        "<input type=\"checkbox\" name=\"age\" value=\"The fantasy fiction book is for adults.\"> The fantasy fiction book is for adults."
                    ]
                },
                {
                    "text": "Are you interested in a new release, or an older fantasy fiction book?",
                    "options": [
                        "<input type=\"checkbox\" name=\"release\" value=\"I am interested in a new release fantasy fiction book.\"> I am interested in a new release fantasy fiction book.",
                        "<input type=\"checkbox\" name=\"release\" value=\"I am interested in an older fantasy fiction book.\"> I am interested in an older fantasy fiction book."
                    ]
                },
                {
                    "text": "Are you looking for a fantasy fiction book that is part of a best selling series?",
                    "options": [
                        "<input type=\"checkbox\" name=\"series\" value=\"Yes, I am looking for a fantasy fiction book that is part of a best selling series.\"> Yes, I am looking for a fantasy fiction book that is part of a best selling series.",
                        "<input type=\"checkbox\" name=\"series\" value=\"No, I am not specifically looking for a fantasy fiction book that is part of a best selling series.\"> No, I am not specifically looking for a fantasy fiction book that is part of a best selling series."
                    ]
                },
                {
                    "text": "Do you prefer a fantasy fiction book with a male or female protagonist?",
                    "options": [
                        "<input type=\"checkbox\" name=\"protagonist\" value=\"I prefer a fantasy fiction book with a male protagonist.\"> I prefer a fantasy fiction book with a male protagonist.",
                        "<input type=\"checkbox\" name=\"protagonist\" value=\"I prefer a fantasy fiction book with a female protagonist.\"> I prefer a fantasy fiction book with a female protagonist."
                    ]
                },
                {
                    "text": "Would you like a recommendation for a fantasy fiction book?",
                    "options": [
                        "<input type=\"checkbox\" name=\"recommendation\" value=\"Yes, I would like a recommendation for a fantasy fiction book.\"> Yes, I would like a recommendation for a fantasy fiction book.",
                        "<input type=\"checkbox\" name=\"recommendation\" value=\"No, I don't need a recommendation for a fantasy fiction book.\"> No, I don't need a recommendation for a fantasy fiction book."
                    ]
                },
                {
                    "text": "Are you looking for a fantasy fiction book with a specific theme, like magic or mythology?",
                    "options": [
                        "<input type=\"checkbox\" name=\"theme\" value=\"Yes, I am looking for a fantasy fiction book with a theme of magic.\"> Yes, I am looking for a fantasy fiction book with a theme of magic.",
                        "<input type=\"checkbox\" name=\"theme\" value=\"Yes, I am looking for a fantasy fiction book with a theme of mythology.\"> Yes, I am looking for a fantasy fiction book with a theme of mythology.",
                        "<input type=\"checkbox\" name=\"theme\" value=\"No, I am not looking for a fantasy fiction book with a specific theme.\"> No, I am not looking for a fantasy fiction book with a specific theme."
                    ]
                },
                {
                    "text": "Does the length of the fantasy fiction book matter to you?",
                    "options": [
                        "<input type=\"checkbox\" name=\"length\" value=\"The length of the fantasy fiction book does matter to me.\"> The length of the fantasy fiction book does matter to me.",
                        "<input type=\"checkbox\" name=\"length\" value=\"The length of the fantasy fiction book does not matter to me.\"> The length of the fantasy fiction book does not matter to me."
                    ]
                },
                {
                    "text": "Would you prefer the fantasy fiction book to have a happy or a tragic ending?",
                    "options": [
                        "<input type=\"checkbox\" name=\"ending\" value=\"I would prefer the fantasy fiction book to have a happy ending.\"> I would prefer the fantasy fiction book to have a happy ending.",
                        "<input type=\"checkbox\" name=\"ending\" value=\"I would prefer the fantasy fiction book to have a tragic ending.\"> I would prefer the fantasy fiction book to have a tragic ending."
                    ]
                },
                {
                    "text": "Are you buying the fantasy fiction book for yourself or as a gift?",
                    "options": [
                        "<input type=\"checkbox\" name=\"purpose\" value=\"I am buying the fantasy fiction book for myself.\"> I am buying the fantasy fiction book for myself.",
                        "<input type=\"checkbox\" name=\"purpose\" value=\"I am buying the fantasy fiction book as a gift.\"> I am buying the fantasy fiction book as a gift."
                    ]
                },
                {
                    "text": "Do you have a preference for reading paperbacks, hardcovers or e-books?",
                    "options": [
                        "<input type=\"checkbox\" name=\"format\" value=\"I have a preference for reading paperbacks.\"> I have a preference for reading paperbacks.",
                        "<input type=\"checkbox\" name=\"format\" value=\"I have a preference for reading hardcovers.\"> I have a preference for reading hardcovers.",
                        "<input type=\"checkbox\" name=\"format\" value=\"I have a preference for reading e-books.\"> I have a preference for reading e-books."
                    ]
                },
                {
                    "text": "Are there certain elements or themes you gravitate towards in a fantasy fiction book?",
                    "options": [
                        "<input type=\"checkbox\" name=\"elements\" value=\"Yes, there are certain elements or themes I gravitate towards in a fantasy fiction book.\"> Yes, there are certain elements or themes I gravitate towards in a fantasy fiction book.",
                        "<input type=\"checkbox\" name=\"elements\" value=\"No, there are no specific elements or themes I gravitate towards in a fantasy fiction book.\"> No, there are no specific elements or themes I gravitate towards in a fantasy fiction book."
                    ]
                },
                {
                    "text": "Would you like to explore new authors or stick to your favourite ones?",
                    "options": [
                        "<input type=\"checkbox\" name=\"authors\" value=\"I would like to explore new authors in fantasy fiction book.\"> I would like to explore new authors in fantasy fiction book.",
                        "<input type=\"checkbox\" name=\"authors\" value=\"I would like to stick to my favourite authors in fantasy fiction book.\"> I would like to stick to my favourite authors in fantasy fiction book."
                    ]
                },
                {
                    "text": "Would you prefer the fantasy fiction book to be targeted towards a specific gender?",
                    "options": [
                        "<input type=\"checkbox\" name=\"gender\" value=\"I would prefer the fantasy fiction book to be targeted towards a specific gender.\"> I would prefer the fantasy fiction book to be targeted towards a specific gender.",
                        "<input type=\"checkbox\" name=\"gender\" value=\"I don't have a preference for gender-specific fantasy fiction books.\"> I don't have a preference for gender-specific fantasy fiction books."
                    ]
                },
                {
                    "text": "Do you prefer a single narrator or multiple points of view in a fantasy fiction book?",
                    "options": [
                        "<input type=\"checkbox\" name=\"narrator\" value=\"I prefer a single narrator in a fantasy fiction book.\"> I prefer a single narrator in a fantasy fiction book.",
                        "<input type=\"checkbox\" name=\"narrator\" value=\"I prefer multiple points of view in a fantasy fiction book.\"> I prefer multiple points of view in a fantasy fiction book."
                    ]
                },
                {
                    "text": "Are you interested in reading a fantasy fiction book that includes illustrations?",
                    "options": [
                        "<input type=\"checkbox\" name=\"illustrations\" value=\"Yes, I am interested in reading a fantasy fiction book that includes illustrations.\"> Yes, I am interested in reading a fantasy fiction book that includes illustrations.",
                        "<input type=\"checkbox\" name=\"illustrations\" value=\"No, I am not interested in reading a fantasy fiction book that includes illustrations.\"> No, I am not interested in reading a fantasy fiction book that includes illustrations."
                    ]
                },
                {
                    "text": "Are you interested in fantasy fiction books based on films or TV series?",
                    "options": [
                        "<input type=\"checkbox\" name=\"adaptations\" value=\"Yes, I am interested in fantasy fiction books based on films or TV series.\"> Yes, I am interested in fantasy fiction books based on films or TV series.",
                        "<input type=\"checkbox\" name=\"adaptations\" value=\"No, I am not interested in fantasy fiction books based on films or TV series.\"> No, I am not interested in fantasy fiction books based on films or TV series."
                    ]
                },
                
            ]
        },
        "women's top":
        {
            "questions": [
                {
                    "text": "What is your preferred style for the woman's top?",
                    "options": [
                        "<input type='checkbox' name='style' value='My preferred style for the woman&#39;s top is casual.'> Casual",
                        "<input type='checkbox' name='style' value='My preferred style for the woman&#39;s top is formal.'> Formal",
                        "<input type='checkbox' name='style' value='My preferred style for the woman&#39;s top is sporty.'> Sporty",
                        "<input type='checkbox' name='style' value='My preferred style for the woman&#39;s top is chic.'> Chic"
                    ]
                },
                {
                    "text": "What size of the woman's top are you looking for?",
                    "options": [
                        "<input type='checkbox' name='size' value='The size of the woman&#39;s top I am looking for is Small.'> Small",
                        "<input type='checkbox' name='size' value='The size of the woman&#39;s top I am looking for is Medium.'> Medium",
                        "<input type='checkbox' name='size' value='The size of the woman&#39;s top I am looking for is Large.'> Large"
                    ]
                },
                {
                    "text": "What color preference do you have for the woman's top?",
                    "options": [
                        "<input type='checkbox' name='color' value='My color preference for the woman&#39;s top is black.'> Black",
                        "<input type='checkbox' name='color' value='My color preference for the woman&#39;s top is white.'> White",
                        "<input type='checkbox' name='color' value='My color preference for the woman&#39;s top is blue.'> Blue",
                        "<input type='checkbox' name='color' value='My color preference for the woman&#39;s top is red.'> Red"
                    ]
                },
                {
                    "text": "What is your budget for the woman's top?",
                    "options": [
                        "<input type='checkbox' name='budget' value='My budget for the woman&#39;s top is under $50.'> Under $50",
                        "<input type='checkbox' name='budget' value='My budget for the woman&#39;s top is $50-$100.'> $50-$100",
                        "<input type='checkbox' name='budget' value='My budget for the woman&#39;s top is over $100.'> Over $100"
                    ]
                },
                {
                    "text": "Are you looking for a specific brand of woman's top?",
                    "options": [
                        "<input type='checkbox' name='brand' value='I am looking for a specific brand of woman&#39;s top.'> Yes",
                        "<input type='checkbox' name='brand' value='I am not looking for a specific brand of woman&#39;s top.'> No"
                    ]
                },
                {
                    "text": "Is the woman's top for a special occasion?",
                    "options": [
                        "<input type='checkbox' name='occasion' value='The woman&#39;s top is for a special occasion.'> Yes",
                        "<input type='checkbox' name='occasion' value='The woman&#39;s top is not for a special occasion.'> No"
                    ]
                },
                {
                    "text": "Do you prefer a patterned or a solid colored woman's top?",
                    "options": [
                        "<input type='checkbox' name='pattern' value='I prefer a patterned woman&#39;s top.'> Patterned",
                        "<input type='checkbox' name='pattern' value='I prefer a solid colored woman&#39;s top.'> Solid"
                    ]
                },
                {
                    "text": "Are you in search for a long-sleeved or a short-sleeved woman's top?",
                    "options": [
                        "<input type='checkbox' name='sleeve' value='I am in search for a long-sleeved woman&#39;s top.'> Long-Sleeved",
                        "<input type='checkbox' name='sleeve' value='I am in search for a short-sleeved woman&#39;s top.'> Short-Sleeved"
                    ]
                },
                {
                    "text": "Are you looking for a woman's top with a specific neckline?",
                    "options": [
                        "<input type='checkbox' name='neckline' value='I am looking for a woman&#39;s top with a specific neckline.'> Yes",
                        "<input type='checkbox' name='neckline' value='I am not looking for a woman&#39;s top with a specific neckline.'> No"
                    ]
                },
                {
                    "text": "Do you like the woman's top to be fitted or loose?",
                    "options": [
                        "<input type='checkbox' name='fit' value='I like the woman&#39;s top to be fitted.'> Fitted",
                        "<input type='checkbox' name='fit' value='I like the woman&#39;s top to be loose.'> Loose"
                    ]
                },
                {
                    "text": "Do you prefer the woman's top to be cotton or synthetic material?", 
                    "options": [
                     "<input type='checkbox' name='material' value='I prefer the woman&#39;s top to be cotton.'> Cotton",
                     "<input type='checkbox' name='material' value='I prefer the woman&#39;s top to be synthetic material.'> Synthetic Material"
                    ]
                },
                {
                "text": "Is the woman's top going to be worn for everyday use or for an event?",
                "options": [
                    "<input type='checkbox' name='usage' value='The woman&#39;s top is going to be worn for everyday use.'> Everyday Use",
                    "<input type='checkbox' name='usage' value='The woman&#39;s top is going to be worn for an event.'> For an Event"
                ]
                },
                {
                "text": "Would you like the woman's top to have features like pockets or a hood?",
                "options": [
                    "<input type='checkbox' name='features' value='I would like the woman&#39;s top to have features like pockets.'> Pockets",
                    "<input type='checkbox' name='features' value='I would like the woman&#39;s top to have a hood.'> Hood",
                    "<input type='checkbox' name='features' value='I do not want the woman&#39;s top to have any specific features.'> No Specific Features"
                ]
                },
                {
                "text": "Do you prefer a woman's top with a zipper, buttons, or a pull-over style?",
                "options": [
                    "<input type='checkbox' name='closure' value='I prefer a woman&#39;s top with a zipper.'> Zipper",
                    "<input type='checkbox' name='closure' value='I prefer a woman&#39;s top with buttons.'> Buttons",
                    "<input type='checkbox' name='closure' value='I prefer a woman&#39;s top with a pull-over style.'> Pull-Over Style"
                ]
                },
                {
                "text": "Would you like the woman's top to be machine washable or do you prefer hand wash/dry clean only?",
                "options": [
                    "<input type='checkbox' name='wash' value='I would like the woman&#39;s top to be machine washable.'> Machine Washable",
                    "<input type='checkbox' name='wash' value='I prefer a woman&#39;s top that is hand wash/dry clean only.'> Hand Wash/Dry Clean Only"
                ]
                },
                {
                "text": "Are you looking for a woman's top for a specific season?",
                "options": [
                    "<input type='checkbox' name='season' value='I am looking for a woman&#39;s top for a specific season.'> Yes",
                    "<input type='checkbox' name='season' value='I am not looking for a woman&#39;s top for a specific season.'> No"
                ]
                },
                {
                "text": "Do you prefer a woman's top with embellishments (like sequins or embroidery) or a simple design?",
                "options": [
                    "<input type='checkbox' name='design' value='I prefer a woman&#39;s top with embellishments like sequins or embroidery.'> With Embellishments",
                    "<input type='checkbox' name='design' value='I prefer a woman&#39;s top with a simple design.'> Simple Design"
                ]
                },
                {
                "text": "Are you looking for a woman's top that provides certain coverage or modesty?",
                "options": [
                    "<input type='checkbox' name='coverage' value='I am looking for a woman&#39;s top that provides certain coverage or modesty.'> Yes",
                    "<input type='checkbox' name='coverage' value='I am not looking for a woman&#39;s top that provides certain coverage or modesty.'> No"
                ]
                },
                {
                "text": "Do you prefer a woman's top from a sustainable, eco-friendly brand?",
                "options": [
                    "<input type='checkbox' name='sustainable' value='I prefer a woman&#39;s top from a sustainable, eco-friendly brand.'> Yes",
                    "<input type='checkbox' name='sustainable' value='I do not prefer a woman&#39;s top from a sustainable, eco-friendly brand.'> No"
                ]
                },
                {
                "text": "Would you consider a preloved or second-hand woman's top?",
                "options": [
                    "<input type='checkbox' name='secondhand' value='I would consider a preloved or second-hand woman&#39;s top.'> Yes",
                    "<input type='checkbox' name='secondhand' value='I would not consider a preloved or second-hand woman&#39;s top.'> No"
                ]
                }
            ]
        },
        "men's hoodie":
        {
            "questions": [
                {
                    "text": "What size of the men's hoodies are you interested in?",
                    "options": [
                        "<input type='checkbox' name='size' value='I am interested in small size of the men&#39;s hoodies.'> Small",
                        "<input type='checkbox' name='size' value='I am interested in medium size of the men&#39;s hoodies.'> Medium",
                        "<input type='checkbox' name='size' value='I am interested in large size of the men&#39;s hoodies.'> Large",
                        "<input type='checkbox' name='size' value='I am interested in X-large size of the men&#39;s hoodies.'> X-Large"
                    ]
                },
                {
                    "text": "What color of the men's hoodies would you prefer?",
                    "options": [
                        "<input type='checkbox' name='color' value='I would prefer the black color of the men&#39;s hoodies.'> Black",
                        "<input type='checkbox' name='color' value='I would prefer the white color of the men&#39;s hoodies.'> White",
                        "<input type='checkbox' name='color' value='I would prefer the blue color of the men&#39;s hoodies.'> Blue",
                        "<input type='checkbox' name='color' value='I would prefer the red color of the men&#39;s hoodies.'> Red"
                    ]
                },
                {
                    "text": "Do you prefer zipper or pullover men's hoodies?",
                    "options": [
                        "<input type='checkbox' name='type' value='I prefer zipper men&#39;s hoodies.'> Zipper",
                        "<input type='checkbox' name='type' value='I prefer pullover men&#39;s hoodies.'> Pullover"
                    ]
                },
                {
                    "text": "Do you prefer the hoodies with or without a pocket?",
                    "options": [
                        "<input type='checkbox' name='pocket' value='I prefer the men&#39;s hoodies with a pocket.'> With Pocket",
                        "<input type='checkbox' name='pocket' value='I prefer the men&#39;s hoodies without a pocket.'> Without Pocket"
                    ]
                },
                {
                    "text": "Are you interested in any specific brand for the men's hoodies?",
                    "options": [
                        "<input type='checkbox' name='brand' value='I am interested in Nike for the men&#39;s hoodies.'> Nike",
                        "<input type='checkbox' name='brand' value='I am interested in Adidas for the men&#39;s hoodies.'> Adidas",
                        "<input type='checkbox' name='brand' value='I am interested in Puma for the men&#39;s hoodies.'> Puma",
                        "<input type='checkbox' name='brand' value='I am interested in no specific brand for the men&#39;s hoodies.'> No Specific Brand"
                    ]
                },
                {
                    "text": "What is your maximum budget for the men's hoodies?",
                    "options": [
                        "<input type='checkbox' name='budget' value='My maximum budget for the men&#39;s hoodies is $50.'> Up to $50",
                        "<input type='checkbox' name='budget' value='My maximum budget for the men&#39;s hoodies is $100.'> Up to $100",
                        "<input type='checkbox' name='budget' value='My maximum budget for the men&#39;s hoodies is $150.'> Up to $150",
                        "<input type='checkbox' name='budget' value='I do not have a maximum budget for the men&#39;s hoodies.'> No Maximum Budget"
                    ]
                },
                {
                    "text": "For what purpose will you be using the men's hoodies?",
                    "options": [
                        "<input type='checkbox' name='usage' value='I will be using the men&#39;s hoodies for sports.'> Sports",
                        "<input type='checkbox' name='usage' value='I will be using the men&#39;s hoodies for casual wear.'> Casual Wear",
                        "<input type='checkbox' name='usage' value='I will be using the men&#39;s hoodies for work.'> Work"
                    ]
                },
                {
                    "text": "Is there any specific design you are interested in for the men's hoodies?",
                    "options": [
                        "<input type='checkbox' name='design' value='I am interested in plain design for the men&#39;s hoodies.'> Plain",
                        "<input type='checkbox' name='design' value='I am interested in patterned design for the men&#39;s hoodies.'> Patterned",
                        "<input type='checkbox' name='design' value='I am interested in graphic design for the men&#39;s hoodies.'> Graphic",
                        "<input type='checkbox' name='design' value='I am not interested in any specific design for the men&#39;s hoodies.'> No Specific Design"
                    ]
                },
                {
                    "text": "Would you like the hoodies to be insulated for cold weather?",
                    "options": [
                        "<input type='checkbox' name='insulated' value='I would like the men&#39;s hoodies to be insulated for cold weather.'> Yes",
                        "<input type='checkbox' name='insulated' value='I would not like the men&#39;s hoodies to be insulated for cold weather.'> No"            
                    ]
                },
                {
                    "text": "Would you like the men's hoodies to be water resistant?",
                    "options": [
                        "<input type='checkbox' name='water_resistant' value='I would like the men&#39;s hoodies to be water resistant.'> Yes",
                        "<input type='checkbox' name='water_resistant' value='I would not like the men&#39;s hoodies to be water resistant.'> No"          
                    ]
                }
            ]
        }
    };
    return ql[key];
};

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