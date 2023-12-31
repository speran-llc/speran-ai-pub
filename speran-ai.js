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

const renderQuestion = function (opts) {
    log("rendering question element...");

    let ql = QUESTIONS_LIST;
    let ci = ql.currentIndex;
    let q = ql.questions[ci];

    let $qs = $(".questions");

    let id = `question-${ci}`;
    let $obj = $(`#${id}`);

    if ($obj.length > 0) {
        $('html, body').animate({
            scrollTop: $obj.offset().top
        }, 100); // 1000 milliseconds for the animation
        return $obj;
    }

    let template = `
        <div id="${id}" class="question my-5">
          <h2 class="questionText">${q.text}</h2>
          <form>
            <div class="options my-3"></div>
            <div class="d-grid d-sm-block gap-2">
              <button type="submit" class="btn btn-primary">Next</button>
            </div>
          </form>
        </div>
        `;
    $obj = $(template);
    $qs.append($obj);

    $('html, body').animate({
        scrollTop: $obj.offset().top
    }, 100); // 1000 milliseconds for the animation

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

    $form.find('.checkbox-container').on("click", function (event) {
        // Check if the clicked element is not the checkbox
        let $target = $(event.target);
        if (!$target.is('input[type="checkbox"]')) {
            // Toggle the checkbox
            let $parent = $target.closest(".checkbox-container");
            let $cbx = $parent.find('input[type="checkbox"]');
            let checked = $cbx.prop('checked');
            $cbx.prop('checked', !checked);
            ql.currentIndex = ci;
            if (q.answered) {
                $obj.find("button").html("Save changes").prop("disabled", false);
            }
        }
    });

    let $btn = $form.find('button');

    if (ql.questions.length > ci + 1) {
        $btn.html("Next");
    } else {
        $btn.html("Get recommendations from ChatGPT");
    }

    $form.on('submit', function (event) {
        event.preventDefault();

        let li = ql.questions.length - 1;
        let lastId = `question-${li}`;
        let $last = $(`#${lastId}`);

        let $recos = $(".recos");
        $recos.html("");

        if (q.answered) {
            $btn.html("Changes saved!").prop("disabled", true);
            if ($last.length > 0) {
                $last.find("button").html("Refresh recommendations").prop("disabled", false);
            }
        } else {
            $btn.prop("disabled", true);
        }

        let values = $form.find("input:checked").map(function () { return this.value; }).get();
        let answers = values.join(" AND ");
        q.answer = answers;
        q.answered = true;

        // If there are still questions
        if (ql.questions.length > ci + 1) {
            ql.currentIndex = ci + 1;
            renderQuestion(opts);
        } else {
            let $app = $("#app");
            let $nps = $app.find(".nps");
            $nps.addClass("d-none");

            $btn.html(`<i class="fa fa-spinner fa-spin"></i> Getting recommendations from ChatGPT...`).prop("disabled", true);
            $qs.find("input").prop("disabled", true);
            prepareCustomerInfo({
                onComplete: function (data) {
                    $qs.find("input").prop("disabled", false);
                    renderRecommendations({ data: data });
                    $btn.html("Refresh recommendations").prop("disabled", false);
                }
            });
        }
    });

    return $obj;
}

const renderRecommendations = function (opts) {
    let data = opts.data;
    log("data", data);
    let $obj = $(".recos");
    $obj.html(data);

    $('html, body').animate({
        scrollTop: $obj.offset().top
    }, 100); // 1000 milliseconds for the animation

    let $app = $("#app");
    let $nps = $app.find(".nps");
    $nps.removeClass("d-none");

    return $obj;
}

const renderIntro = function (opts) {
    let $obj = $("#intro");

    $obj.find("button").html("Next").prop("disabled", false);

    let $form = $obj.find("form");
    let $btn = $form.find('button');
    $form.on('submit', function (event) {
        event.preventDefault();
        renderQuestion({});
    });

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

$(document).ready(function () {
    $("#lp").on("submit", function (event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $("#intro").offset().top
        }, 100); // 1000 milliseconds for the animation
    });

    renderIntro({});

    new Typewriter($('#title')[0], {
        delay: 1,
        autoStart: true,
        loop: false,
    })
        .typeString(`Let ChatGPT find the right ${PRODUCT_STR} for you`)
        .start();
});