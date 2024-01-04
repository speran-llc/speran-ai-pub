/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
- MAX_QUESTIONS
- QUESTIONS_LIST
*/

QUESTIONS_LIST.questions.splice(MAX_QUESTIONS);

const API_URL = 'https://speran-ai-06e327aea366.herokuapp.com/getRecommendation';

// Function to send a user's message to ChatGPT and display the response
async function getRecommendation(opts) {

    const requestBody = {
        productStr: PRODUCT_STR,
        productsStr: PRODUCTS_STR,
        customerInfo: opts.customerInfo
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const $reco = opts.onStart();

        let responseText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });

            responseText += chunk;

            opts.onDataReceived({ data: responseText, $reco: $reco });
        }
        opts.onEnd($reco);
    } catch (err) {
        log("error", err);
        opts.onError();
    }
}

const log = function () {
    if (window.location.hostname === 'cdpn.io') {
        console.log.apply(console, arguments);
    }
};

const moveToQuestion = function (opts) {
    let ci = 0;
    if (typeof(opts.targetIndex) === 'number') {
        ci = opts.targetIndex;
    }
    let id = `question-${ci}`;
    let $obj = $(`#${id}`);

    if ($obj.length >= 0) {
        $('html, body').animate({
            scrollTop: $obj.offset().top
        }, 100);
    }
};

const moveToQuestionSet = function (opts) {
    let id = opts.id;
    let hid = `questionSet-${id}`;
    let $obj = $(`#${hid}`);

    if ($obj.length >= 0) {
        $('html, body').animate({
            scrollTop: $obj.offset().top
        }, 100);
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
    $app.append($qs);

    if (id === 0) {
        let questionsList = ql.questions.slice(0, 5);
        for (let i = 0; i < 5; i++) {
            renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: i});
        }
        renderQuestionDone();
    } else if (id === 1) {
        let questionsList = ql.questions.slice(5, 10);
        for (let i = 5; i < 10; i++) {
            renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: i});
        }
        renderQuestionDone();
    }
    
    return $qs;
};

const gatherAnswersAndGetRecommendation = function () {
    let $app = $("#app");

    let ql = QUESTIONS_LIST;

    // Specify button display and behavior
    let $btn = $app.find('button');

    // Gather answers from checkboxes
    let $questionDivs = $app.find(".question");
    $questionDivs.each(function (index, element) {
        let $div = $(element);
        let id = parseInt($div.data("id"));
        let q = ql.questions[id];
        let values = $div.find("input:checked").map(function () { return this.value; }).get();
        let answers = values.join(" AND ");
        q.answer = answers;
        q.answered = true;
    });

    // Preparing to get recommendations
    let origTxt = $btn.text();
    $btn.html(`Get recommendations from ChatGPT <i class="fa fa-spinner fa-spin"></i>`).prop("disabled", true);

    // Disable all inputs while recommendation is being generated
    $app.find("input").prop("disabled", true);

    // Prepare all customer answers and generate the recommendation
    let customerInfo = prepareCustomerInfo();
    getRecommendation({
        customerInfo: customerInfo,
        onStart: function () {
            return renderRecommendations();
        },
        onDataReceived: function (args) {
            writeRecommendation(args);
        },
        onEnd: function ($reco) {
            finishRecommendation({ $reco: $reco });
            $btn.html(origTxt);

            // Re-enable all inputs so that customer can made changes
            $app.find("input").prop("disabled", false);
        },
        onError: function () {
            $btn.html("Sorry, there was an error.");
            $app.find("input").prop("disabled", false);
        }
    });
};

const renderQuestionDone = function (opts = {}) {
    let template = `
    <div class="action my-5">
        <button type="button" class="btn btn-primary">Get recommendations from ChatGPT</button>
    </div>
    `;
    $obj = $(template);

    let ql = QUESTIONS_LIST;
    
    let $app = $("#app");
    $app.append($obj);

    // Specify button display and behavior
    let $btn = $app.find('button');

    $btn.on('click', function (event) {
        event.preventDefault();
        gatherAnswersAndGetRecommendation();
    });
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

    // Check the checkbox when user clicks on option
    $obj.find('.checkbox-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);
        if (!$target.is('input[type="checkbox"]')) {
            // Toggle the checkbox
            let $parent = $target.closest(".checkbox-container");
            let $cbx = $parent.find('input[type="checkbox"]');

            let checked = $cbx.prop('checked');
            $cbx.prop('checked', !checked);               

            // Re-enable the recommendation button
            $app.find("button").prop("disabled", false);

            // Remove current recommendations to display new one
            $app.find(".recos").remove();
        }
    });

    return $obj;
}

const writeRecommendation = function (opts = {}) {
    let data = opts.data;
    let $obj = opts.$reco;
    let $content = $obj.find(".recosContent");
    $content.html(data);

    let scrollHeight = $obj.prop('scrollHeight');
    $obj.animate({scrollTop: scrollHeight}, "slow");

    return $obj;
};

const finishRecommendation = function (opts = {}) {
    let $app = $("#app");
    let $obj = opts.$reco;
    let ql = QUESTIONS_LIST;
    let qc = ql.questions.length;
    let answered = ql.questions.filter(function (el) {
        return el.answered;
    }).length;

    let template = `
        <div class="change"><strong>Note: Change your answers above to get a different set of recommendations.</strong></div>
`;
    let $change = $(template);
    $obj.append($change);

    let allAnswered = (qc === answered);

    if (!allAnswered) {
        // Show button to continue
        let continueTemplate = `
            <div class="actions my-5">
                <h5>Improve your recommendations by answering just 5 more questions.</h5>
                <button type="button" class="btn btn-primary my-3 continue">Continue</button>
            </div>
        `;
        let $continueDiv = $(continueTemplate);
        let $continue = $continueDiv.find("button.continue");
        $continue.on('click', function (event) {
            // Remove all previous recommendations and recommendation CTAs
            $app.find(".recos").addClass("d-none").remove();
            $app.find(".action").addClass("d-none").remove();
       
            let $nqs = renderQuestionSet({id: 1});
            moveToQuestionSet({id: 1});
            renumberQuestions();
        });    
        $obj.append($continueDiv);
    } else {
        // Disable for now
        /*
        let moreTemplate = `
        <div class="actions my-5">
            <h5>Want more? Ask ChatGPT for more recommendations.</h5>
            <button type="button" class="btn btn-primary my-3 getMoreRecommendations">Get more recommendations</button>
        </div>
        `;
        let $moreDiv = $(moreTemplate);
        let $more = $moreDiv.find("button.getMoreRecommendations");
        $more.on('click', function (event) {
            // Remove all previous recommendation CTAs
            $app.find(".action").addClass("d-none").remove();
            gatherAnswersAndGetRecommendation();
        });    
        $obj.append($moreDiv);
        */
    }

    $app.append($obj);

    let scrollHeight = $obj.prop('scrollHeight');
    $obj.animate({scrollTop: scrollHeight}, "slow");

    return $obj;
};

const renumberQuestions = function () {
    let $app = $("#app");

    $app.find(".question .stepNum").each(function (index, element) {
       let $q =  $(element);
       let text = `${index+1} of 10`;
       $q.html(text);
    });

};

const renderRecommendations = function (opts = {}) {
    let recosTemplate = `
        <div class="recos">
            <div class="recosContent"></div>
        </div>
    `;
    $obj = $(recosTemplate);

    let $app = $('#app');
    $app.append($obj);

    $('html, body').animate({
        scrollTop: $obj.offset().top
    }, 100); // 1000 milliseconds for the animation

    return $obj;
}

const prepareCustomerInfo = function () {
    let ql = QUESTIONS_LIST;

    let qs = ql.questions.filter(function (el) {
        return (el.hasOwnProperty("answer") && typeof el.answer === "string" && el.answer.length > 0);
    }).map(function (el) {
        return `When the customer was asked, "${el.text}", they responded with "${el.answer}".`;
    });
    return qs;
};

$(document).ready(function () {
    
    let $qs = renderQuestionSet({id: 0});

    $("#lp").on("submit", function (event) {
        event.preventDefault();
        
        // Go to first question
        moveToQuestionSet({id: 0});
    });

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find the right ${PRODUCT_STR} for you`)
        .start();
});