/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
*/

const API_URL_SEND = 'http://localhost:5001/sendMessage';

const QUESTIONS_LIST = getQuestionsList(PRODUCT_STR);

const USER_ID = generateUUID();

let HISTORY = [
    `You are an experienced salesperson that sells ${PRODUCTS_STR}. You are friendly. You provide a lot of information.`
];

async function sendMessage(opts = {}) {

    let hs = HISTORY;

    let prompt = opts.prompt;

    hs.push(prompt);

    let links = `
        If any product or service is mentioned, bold the name and link to a google search for that product.
        The class name of the link should be "recommendationLink" and the target of the link should be "_blank".
        Bold all words that relate to my needs.
    `;

    let final = [...hs];
    final.push(links);

    let finalPrompt = final.join("\n");
    log("finalPrompt", finalPrompt);

    const requestBody = {
        prompt: finalPrompt,
        productStr: PRODUCT_STR,
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
        hs.push(responseText);
        opts.onEnd();
    } catch (err) {
        log("error", err);
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
    let $pt = $p.find("textarea");

    // Check the checkbox when user clicks on option
    $obj.find('.cbx-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);
        if (!$target.is('input[type="checkbox"]')) {
            // Toggle the checkbox
            let $parent = $target.closest(".cbx-container");
            let $cbx = $parent.find('input[type="checkbox"]');

            let checked = $cbx.prop('checked');

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

            $cbx.prop('checked', !checked);
        }
    });

    return $obj;
}

$(document).ready(function () {

    let $app = $("#app");
    let template = `
    <div id="hero" class="d-flex align-items-center justify-content-center">
      <div class="text-background p-3">
        <div class="row text-background-inner mx-auto">
          <div class="col-md-8">
            <h1 id="title"></h1>
          </div>
        </div>
      </div>
    </div>    
    <div class="promptResponse mx-auto px-3 pt-3 bg-light sai-content">
    </div>
    <div class="messageHelpers my-3 px-3 sai-content mx-auto">
        <h1>Message Helpers</h1>
        <p>Quickly prepare a message to ChatGPT by clicking an answer to add it to your message. Click again to remove it.</p>
        <p><strong>Note:</strong> Click as few or as many as you want.</p>
        <div class="helpers"></div>
    </div>
    
    <!-- sticky -->
    <div class="prompt px-3 py-1 bg-dark mx-auto">
        <div class="mb-1 d-grid gap-2">
            <button type="button" class="togglePrompt btn-sm btn">
                <i class="fa fa-solid fa-chevron-up text-light"></i>
            </button>
        </div>
        <div class="textarea-container w-100">
<textarea name="text" id="text" class="w-100 pe-5 form-control">
Help me find a ${PRODUCT_STR} based on my needs.
</textarea>
            <button type="button" class="btn btn-primary btn-sm send"><i class="fa-solid fa-paper-plane fa-xs"></i></button>
        </div>
        <div class="promptHelp d-flex align-items-center">
            <button type="button" class="btn btn-secondary btn-sm viewMessageHelpers"><i class="fa-solid fa-minus fa-xs"></i></button>
            <div class="text-white-50 ms-2 fs-6">Toggle message helpers</div>
        </div>
    </div>    
    `;

    $app.append(template)

    let $hero = $app.find("#hero");
    let $prompt = $app.find(".prompt");
    let $promptInput = $prompt.find("textarea");
    let $bs = $prompt.find("button.send");
    let $pr = $app.find(".promptResponse");
    let $promptHelp = $app.find(".promptHelp");
    let $mh = $app.find(".messageHelpers");
    let $vmh = $promptHelp.find("button.viewMessageHelpers");

    $bs.on("click", function () {

        let origTxt = $bs.html();
        $bs.html(`<i class="fa fa-spinner fa-spin fa-xs"></i>`).prop("disabled", true);

        let message = $prompt.find("textarea").val();

        // Clear out prompt and focus back on it
        $promptInput.val("");
        $promptInput.focus();

        // Reset height of textarea
        $promptInput.removeClass("expanded");

        // Hide message helpers
        $mh.addClass("d-none");
        $vmh.html(`<i class="fa fa-solid fa-plus fa-xs"></i>`);

        // Disable message helper
        $vmh.prop("disabled", true);

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

                $app.scrollTop($app.prop('scrollHeight'));
            },
            onEnd: function () {
                let endText = `
                    <div class="mb-4"></div>
                    <hr />
                `;
                $pr.html($pr.html() + endText);

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
        } else {
            $vmh.html(`<i class="fa fa-solid fa-plus fa-xs"></i>`);
        }

        $messageHelpers.toggleClass("d-none");

        $app.scrollTop($messageHelpers.position().top + 100);
    });

    let $tp = $app.find(".togglePrompt");
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
        .typeString(`Let ChatGPT find the right ${PRODUCT_STR} for you`)
        .start();
});

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