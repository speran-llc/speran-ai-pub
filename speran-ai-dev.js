/*
Inputs:
- PRODUCT_STR
- PRODUCTS_STR
- MAX_QUESTIONS
- QUESTIONS_LIST
*/

QUESTIONS_LIST.questions.splice(MAX_QUESTIONS);

const API_URL = 'http://localhost:5001/getRecommendation';

// Function to send a user's message to ChatGPT and display the response
async function getRecommendation(opts) {

    const requestBody = {
        productStr: PRODUCT_STR,
        productsStr: PRODUCTS_STR,
        customerInfo: opts.customerInfo
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (response.ok) {
        const data = await response.json();
        log("response", data);
        opts.onComplete(data.content);
    } else {
        log("response error", response);
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
        <div id="${hid}" class="questions"></div>
    `;

    let $qs = $(template);
    let $app = $('#app');
    $app.append($qs);

    if (id === 0) {
        let questionsList = ql.questions.slice(0, 5);
        renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: 0});
    } else if (id === 1) {
        let questionsList = ql.questions.slice(5, 10);
        renderQuestion({$questionSet: $qs, questionsList: questionsList, targetIndex: 5});
    }
    
    return $qs;
};

const renderQuestion = function (opts = {}) {
    log("rendering question element...");

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
        <div id="${id}" class="question my-5">
            <div class="stepNum">${questionNum} of ${lastStepNum}</div>
            <h2 class="questionText">${q.text}</h2>
          
            <form>
                <div class="options my-3"></div>
                <div class="d-grid d-sm-block gap-2 actions">
                    <button type="submit" class="btn btn-primary">Next</button>
                </div>
            </form>
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

    let $form = $obj.find("form");

    // Check the checkbox when user clicks on option
    $form.find('.checkbox-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);
        if (!$target.is('input[type="checkbox"]')) {

            // Toggle the checkbox
            let $parent = $target.closest(".checkbox-container");
            let $cbx = $parent.find('input[type="checkbox"]');

            let disabled = $cbx.prop("disabled");

            if (!disabled) {
                let checked = $cbx.prop('checked');
                $cbx.prop('checked', !checked);

                if (q.answered) {
                    $obj.find("button").html("Save changes").prop("disabled", false);
                }
            }
        }
    });

    // Specify button display and behavior
    let $btn = $form.find('button');

    $form.on('submit', function (event) {
        event.preventDefault();

        let updatingAnswer = false;

        // Specify button behavior
        if (q.answered) {
            // User is updating answer
            $btn.html("Changes saved!").prop("disabled", true);
            updatingAnswer = true;
        } else {
            // User is answering question for first time
            $btn.prop("disabled", true);
        }

        // Gather answers from form
        let values = $form.find("input:checked").map(function () { return this.value; }).get();
        let answers = values.join(" AND ");
        q.answer = answers;
        q.answered = true;

        let sql = opts.questionsList;
        let allQuestionsInSetAnswered = sql.filter(function (el) {
            return el.answered;
        }).length === sql.length;    

        if (allQuestionsInSetAnswered) {
            let $recoDiv = renderRecommendationDiv();
            $recoDiv.removeClass("d-none")
            $recoDiv.find("button").prop("disabled", false);
        } else {
            // If we're updating the answer, then the next question already exists.
            // If we're not, then we need to render the next question
            if (!updatingAnswer) {
                renderQuestion({$questionSet: $qs, questionsList: sql, targetIndex: ci+1 });
                moveToQuestion({targetIndex: ci+1});
            }
        }
    });

    return $obj;
}

const renderRecommendations = function (opts = {}) {
    let data = opts.data;
    log("data", data);

    let recosTemplate = `
        <div class="recos">
            <div class="recosContent">${data}</div>
        </div>
    `;

    let $obj = $(recosTemplate);

    let ql = QUESTIONS_LIST;
    let qc = ql.questions.length;
    let answered = ql.questions.filter(function (el) {
        return el.answered;
    }).length;

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
            $continue.prop('disabled', true);
    
            // Disable the previous set of questions until we show the new recommendations
            $app.find("input").prop("disabled", true);
    
            let $nqs = renderQuestionSet({id: 1});
            moveToQuestionSet({id: 1});
            
            // Hide the CTA div while going through the questions
            let $recoDiv = renderRecommendationDiv();
            $recoDiv.addClass("d-none");
    
        });    
        $obj.append($continueDiv);
    } else {
        let template = `
            <div class="change"><strong>Note: You can also change your answers above to get a different set of recommendations.</strong></div>
        `;
        let $change = $(template);
        $obj.append($change);
    }

    let $app = $('#app');
    $app.append($obj);

    // Hide the reco div 
    let $recoDiv = renderRecommendationDiv();
    $recoDiv.addClass("d-none")
    $recoDiv.find("button").prop("disabled", true);

    // When the second recommendations are shown, allow user to go back and make changes.
    // Changes are disabled when customers are answering the second set of questions
    $app.find("input").prop("disabled", false);

    $('html, body').animate({
        scrollTop: $obj.offset().top
    }, 100); // 1000 milliseconds for the animation

    return $obj;
}

const prepareCustomerInfo = function (opts) {
    let ql = QUESTIONS_LIST;

    let qs = ql.questions.filter(function (el) {
        return (el.hasOwnProperty("answer") && typeof el.answer === "string" && el.answer.length > 0);
    }).map(function (el) {
        return `When the customer was asked, "${el.text}", they responded with "${el.answer}".`;
    })

    getRecommendation({
        customerInfo: qs,
        onComplete: function (data) {
            opts.onComplete(data);
        }
    });
};

const renderRecommendationDiv = function () {
    let $app = $("#app");

    let $obj = $app.find(".floating-cta-container");
    if ($obj.length > 0) {
        return $obj;
    }

    let template = `
        <div class="floating-cta-container p-3 d-none">
            <button type="button" class="btn btn-primary" disabled>Get recommendations from ChatGPT</button>
        </div>
    `;
    $obj = $(template);
    $app.append($obj);

    $btn = $obj.find("button");

    $btn.on("click", function (event) {
        // Preparing to get recommendations
        let origText = $btn.text();
        $btn.html(`Get recommendations from ChatGPT <i class="fa fa-spinner fa-spin"></i>`).prop("disabled", true);

        // Disable all inputs while recommendation is being generated
        $app.find("input").prop("disabled", true);

        // Remove all previous recommendations
        $app.find(".recos").remove();

        // Remove all step numbers as they no longer make sense
        $app.find(".stepNum").remove();

        // Prepare all customer answers and generate the recommendation
        prepareCustomerInfo({
            onComplete: function (data) {
                // Reset button to original text
                $btn.html(origText);

                // Re-enable all inputs so that customer can made changes
                $app.find("input").prop("disabled", false);

                // Display the recommendation
                renderRecommendations({ data: data });
            }
        });
    });
    return $obj;
};

$(document).ready(function () {
    
    let $qs = renderQuestionSet({id: 0});

    $("#lp").on("submit", function (event) {
        event.preventDefault();
        
        // Go to first question
        moveToQuestionSet({id: 0});
    });

    let $cta = renderRecommendationDiv();

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find the right ${PRODUCT_STR} for you`)
        .start();
});