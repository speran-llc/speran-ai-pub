/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
- MAX_QUESTIONS
- QUESTIONS_LIST
*/

QUESTIONS_LIST.currentIndex = 0;
QUESTIONS_LIST.questions.splice(MAX_QUESTIONS);

const API_URL_SEND = 'http://localhost:5001/sendMessage';

let HISTORY = [];

async function sendMessage(opts = {}) {

    let hs = HISTORY;

    let prompt = opts.prompt;

    hs.push(prompt);

    let links = `If any product is mentioned, link to a google search for that product. The class name of the link should be "recommendationLink".`;
    
    let final = [...hs];
    final.push(links);

    let finalPrompt = final.join("\n");
    console.log("finalPrompt", finalPrompt);

    const requestBody = {
        prompt: finalPrompt
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
        opts.onEnd();
    } catch (err) {
        log("error", err);
        opts.onError({current: current});
    }
}

const log = function () {
    if (window.location.hostname === 'cdpn.io') {
        console.log.apply(console, arguments);
    }
};

const renderQuestionSet = function (opts = {}) {

    let ql = QUESTIONS_LIST;

    let id = opts.id;
    let hid = `questionSet-${id}`;

    let template = `
        <div id="${hid}" class="questions">
        </div>
    `;

    let $qs = $(template);
    let $app = $('#app');
    let $mh = $app.find(".messageHelpers");
    $mh.append($qs);

    if (id === 0) {
        let questionsList = ql.questions.slice(0, 5);
        for (let i = 0; i < 5; i++) {
            renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: i});
        }
    } else if (id === 1) {
        let questionsList = ql.questions.slice(5, 10);
        for (let i = 5; i < 10; i++) {
            renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: i});
        }
    }
    
    return $qs;
};

const renderQuestion = function (opts = {}) {

    let ql = QUESTIONS_LIST;
    
    let ci = opts.targetIndex;

    let q = ql.questions[ci];

    let $qs = opts.$questionSet;

    let id = `question-${ci}`;
    let $obj = $(`#${id}`);

    if ($obj.length > 0) {
        return $obj;
    }

    let $app = $("#app");

    let questionNum = (ci % 5) + 1;
    let lastStepNum = Math.min(MAX_QUESTIONS, ql.questions.length, 5);

    let template = `
        <div id="${id}" data-id="${ci}" class="question my-5">
            <div class="stepNum">${questionNum} of ${lastStepNum}</div>
            <h2 class="questionText">${q.text}</h2>         
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
        <div class="option my-2 p-3 checkbox-container d-flex align-middle">
          <input type="checkbox" value="${option}" id="${inputId}" class="form-check-input me-3">
          <div class="form-check-label">
            ${option}
          </div>
        </div>
      `;
        let $d = $(d);
        $ds.append($d);
    }

    let $p = $app.find(".prompt");
    let $pt = $p.find("textarea");

    // Check the checkbox when user clicks on option
    $obj.find('.checkbox-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);
        if (!$target.is('input[type="checkbox"]')) {
            // Toggle the checkbox
            let $parent = $target.closest(".checkbox-container");
            let $cbx = $parent.find('input[type="checkbox"]');

            let checked = $cbx.prop('checked');

            let text = $pt.val();
            let val = $cbx.val();

            if (!checked) {
                text = text.replace(val, "");
                text = text + "\n" + val;
            } else {
                text = text.replace(val, "");
            }
            text = text.trim();
            $pt.val(text);

            // Expand textarea
            $pt.css('height', '25vh');
            let $tp = $app.find(".togglePrompt");
            $tp.html(`<i class="fa fa-solid fa-chevron-down text-light"></i>`);

            $cbx.prop('checked', !checked);
        }
    });

    return $obj;
}


const renumberQuestions = function () {
    let $app = $("#app");

    $app.find(".question .stepNum").each(function (index, element) {
       let $q =  $(element);
       let text = `${index+1} of 10`;
       $q.html(text);
    });

};

$(document).ready(function () {
    
    let $app = $("#app");
    let template = `
    <div class="promptResponse mx-auto px-3 pt-3 bg-light sai-content">
    </div>
    <div class="messageHelpers my-3 d-none px-2 sai-content mx-auto">
        <h1>Message helpers</h1>
        <p>Check the answers below to add them to your message. Uncheck to remove them.</p>
    </div>
    <div class="prompt px-3 py-1 bg-dark mx-auto">
        <div class="d-flex justify-content-center mb-1"><button type="button" class="togglePrompt btn-sm btn"><i class="fa fa-solid fa-chevron-up text-light"></i></div>
        <div class="textarea-container w-100">
<textarea name="text" id="text" class="w-100 pe-5 form-control" onChange="this.parentNode.dataset.replicatedValue = this.value">
Help me find a ${PRODUCT_STR} based on my needs:
</textarea>
            <button type="button" class="btn btn-primary btn-sm send"><i class="fa-solid fa-paper-plane fa-xs"></i></button>
        </div>
        <div class="promptHelp d-flex justify-content-center">
            <button type="button" class="btn btn-secondary btn-sm viewMessageHelpers"><i class="fa-solid fa-plus"></i></button>
        </div>
    </div>    
    `;

    $app.append(template)

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

        $prompt.find("textarea").val("");

        $mh.addClass("d-none");

        // Reset height of textarea
        $promptInput.css('height', '100px');

        $app.find("input:checked").prop("checked", false);

        $vmh.html(`<i class="fa-solid fa-plus"></i>`);

        sendMessage({
            prompt: message,
            onStart: function (args) {
                
                $pr.scrollTop($pr.prop('scrollHeight'));           

                $pr.html($pr.html() + `
                    <div class="py-2"><strong>You</strong></div>
                    <div class="mb-4">${message}</div>
                    <div class="py-2"><strong>ChatGPT</strong></div>
                `);

                return $pr.html();
            },
            onDataReceived: function (args) {
                let current = args.current;
                html = current + marked.parse(args.data);
                $pr.html(html);

                $pr.scrollTop($pr.prop('scrollHeight'));           
            },
            onEnd: function ($reco) {
                $pr.html($pr.html() + `<div class="mb-4"></div>`);

                $bs.html(origTxt);
                $bs.prop("disabled", false);
            },
            onError: function (args) {
                let current = args.current;
                html = [current, "Sorry, there was an error. Please try again later."].join("\n\n");
                $pr.html(html);

                $app.find("input").prop("disabled", false);
            }
        });

    });

    $vmh.on("click", function (event) {
        let $messageHelpers = $app.find(".messageHelpers");
        
        let hidden = $messageHelpers.hasClass("d-none");
        if (hidden) {
            $vmh.html(`<i class="fa-solid fa-minus"></i>`);
        } else {
            $vmh.html(`<i class="fa-solid fa-plus"></i>`);
        }

        $messageHelpers.toggleClass("d-none");
        
        $('html, body').animate({
            scrollTop: $messageHelpers.offset().top
        }, 100);
    });

    let $tp = $app.find(".togglePrompt");
    $tp.on("click", function () {
        let height = $promptInput.css("height");
        if (height === "100px") {
            $promptInput.css("height", "25vh");
            $tp.html(`<i class="fa fa-solid fa-chevron-down text-light"></i>`);
        } else {
            $promptInput.css("height", "100px");
            $tp.html(`<i class="fa fa-solid fa-chevron-up text-light"></i>`);
        }
    });

    renderQuestionSet({id: 0});
    renderQuestionSet({id: 1});
    renumberQuestions();

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find the right ${PRODUCT_STR} for you`)
        .start();
});