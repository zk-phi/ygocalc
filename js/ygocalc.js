// *TODO* エクストラターン入りのタイミングを知るためにタイマーほしい
// *TODO* 右スワイプで任意の値にセット or 任意の値を引く
// *TODO* ダイスやコインが外に出ないように見えない壁を置く

// --------------------------------------------------------------------------------
// utilities

function touch_available_p()
{
    return 'ontouchstart' in window;
}

function distance_sq(x1, y1, x2, y2)
{
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
}

function constraint(v, min, max)
{
    return v < min ? min : v > max ? max : v;
}

function touch_get_x(e)
{
    return event.changedTouches[0].clientX;
}

function touch_get_y(e)
{
    return event.changedTouches[0].clientY;
}

function fill_zeros(n, digits)
{
    var str = n + "";
    while(str.length < digits) str = "0" + str;
    return str;
}

function read_integer(msg, dflt)
{
    var input;
    while(isNaN(input = parseInt(window.prompt(msg, dflt))))
        msg = "整数で入力してください";
    return input;
}

// --------------------------------------------------------------------------------
// common UI vars

var startX, startY, startTop, currentX, currentY, dragging_flag, scrolling_flag;

// --------------------------------------------------------------------------------
// life point display

// life points
var lp = [8000, 8000], lp_history = [];

function lp_refresh_display(side)
{
    var $div = $(".lp" + (side == 0 ? ".player" : ".opponent"));

    $div.addClass("whiteout", function(){
        if(lp[side] <= 0) $(this).html("0").addClass("loser");
        else $(this).html(lp[side]).removeClass("loser");
        $(this).removeClass("whiteout", 300);
    });
}

function lp_initialize()
{
    lp = [8000, 8000], lp_history = [];
    lp_refresh_display(0), lp_refresh_display(1);
}

function lp_increase(side, diff)
{
    lp_history.push({ "side": side, "diff": diff });

    if(diff == "/2") lp[side] /= 2;
    else if(diff == "*2") lp[side] *= 2;
    else if(diff == "Yu-Jo") lp[0] = lp[1] = (lp[0] + lp[1]) / 2;
    else lp[side] += diff;

    if(side == 2)
        lp_refresh_display(0), lp_refresh_display(1);
    else
        lp_refresh_display(side);
}

function lp_recalculate_whole_history()
{
    lp = [8000, 8000];

    for(i = 0; i < lp_history.length; i++){
        var diff = lp_history[i].diff;
        if(diff == "/2") lp[lp_history[i].side] /= 2;
        else if(diff == "*2") lp[lp_history[i].side] *= 2;
        else if(diff == "Yu-Jo") lp[0] = lp[1] = (lp[0] + lp[1]) / 2;
        else lp[lp_history[i].side] += diff;
    }

    lp_refresh_display(0), lp_refresh_display(1);
}

function lp_undo()
{
    var hist = lp_history.pop();
    lp_recalculate_whole_history();
}

// --------------------------------------------------------------------------------
// damage selector

// calc_state 0: not touched / 1: pending / 2: selecting
var calc_state = 0, calc_hold_timer, calc_tap_count = 0;
var selected_side, selected_value, sign = 1;

function grid_show()
{
    var i = sign < 1 ? 4 : 0, j = 0, step = sign < 1 ? -1 : 1;

    $("#grid_screen .cell").each(function(){
        var html = i + "" + j++;
        $(this).html(html);
        if(j == 10) j = 0, i += step;
    });

    $("#grid_screen").fadeIn(300).css("display", "table");
    $("#diff_screen").fadeIn(300).css("display", "table");
    $(".counter").fadeTo(300, 0.3);
}

function grid_hide()
{
    $("#grid_screen").fadeOut(300, function(){ $(this).hide(); });
    $("#diff_screen").fadeOut(300, function(){ $(this).hide(); });
    $(".counter").fadeTo(300, 1);
}

function grid_update()
{
    $(document.elementFromPoint(currentX, currentY)).each(function(){
        if($(this).is(".cell:not(.cell_onmouse)")){
            selected_value = parseInt($(this).html()) * 100 * sign;
            clearInterval(calc_hold_timer);
            $(".cell_onmouse").removeClass("cell_onmouse").removeClass("red", 300);
            $(this).addClass("cell_onmouse");
            $("#diff_screen .cell").html(selected_value + "");
            calc_hold_timer = setInterval(function(){
                selected_value += 50 * sign;
                $("#diff_screen .cell").html(selected_value + "");
                $(".cell_onmouse").addClass("red", 300);
            }, 1200);
        }
    });
}

function lp_touchstart_handler(e)
{
    calc_state = 1;
    startX = currentX = touch_get_x(e);
    startY = currentY = touch_get_y(e);
    selected_side = $(this).hasClass("player") ? 0 : 1;

    // triple-tap, double-tap detection
    calc_tap_count += 1;
    if(calc_tap_count == 3) lp_initialize();
    else if(calc_tap_count == 1) setTimeout(function(){
        if(calc_tap_count == 1) put_counter(startX, startY);
        else if(calc_tap_count == 2) lp_undo();
        calc_tap_count = 0;
    }, 400);

    return false;
}

function lp_touchend_handler()
{
    if(calc_state == 2)
        lp_increase(selected_side, selected_value);

    calc_state = 0;

    clearInterval(calc_hold_timer);
    grid_hide();

    return false;
}

function lp_touchmove_handler(e)
{
    if($(".loser").length != 0)
        return false;

    currentX = touch_get_x(e);
    currentY = touch_get_y(e);

    if(calc_state == 1){
        var dX = currentX - startX;
        var dY = currentY - startY;
        if(dX < -200) calc_state = 0, lp_increase(selected_side, "/2");
        else if(dX > 200) calc_state = 0, lp_increase(selected_side, -read_integer("ダメージ量"));
        // else if(dX > 200) calc_state = 0, lp_increase(selected_side, "*2");
        else if(dY < -50) calc_state = 2, sign = 1, grid_show();
        else if(dY > 50) calc_state = 2, sign = -1, grid_show();
    }

    if(calc_state != 1) calc_tap_count = 0;
    if(calc_state == 2) grid_update();

    return false;
}

// --------------------------------------------------------------------------------
// counters

function put_counter(x, y)
{
    $("<div>")
        .addClass("counter")
        .css({ top: constraint(y - 43, 0, $("#main_screen").height() - 86),
               left: constraint(x - 43, 0, $("#main_screen").width() - 86) })
        .appendTo($("body"))
        .bind("touchstart", counter_touchstart_handler)
        .bind("touchend", counter_touchend_handler)
        .bind("touchmove", counter_touchmove_handler);
}

function counter_touchstart_handler(e)
{
    dragging_flag = false;
    $(this).addClass("grabbed");

    startX = touch_get_x(e);
    startY = touch_get_y(e);

    return false;
}

function counter_touchend_handler()
{
    if(dragging_flag)
        $(this).removeClass("grabbed", 300);
    else
        $(this).remove();

    return false;
}

function counter_touchmove_handler(e)
{
    var $main = $("#main_screen");
    var x = touch_get_x(e), y = touch_get_y(e);

    if(!$(this).hasClass("grabbed")) return;

    if(!dragging_flag && distance_sq(x, y, startX, startY) > 100)
        dragging_flag = true;

    if(dragging_flag)
        $(this).css({ left: constraint(x - 43, 0, $("#main_screen").width() - 86),
                      top: constraint(y - 43, 0, $("#main_screen").height() - 86) });

    return false;
}

// --------------------------------------------------------------------------------
// timer

var timer_minutes = 40;
var timer_hold_timer = null, timer_update_timer = null, timer_remaining_seconds;

function timer_button_touchstart_handler()
{
    timer_hold_timer = setTimeout(function(){
        timer_hold_timer = null;
        timer_minutes = read_integer("対戦時間 (分)");
    }, 1200);

    return false;
}

function timer_update()
{
    $("#timer_button")
        .html(fill_zeros(Math.floor(timer_remaining_seconds / 60), 2)
              + ":" + fill_zeros(timer_remaining_seconds % 60, 2));

    if(timer_remaining_seconds > 0) timer_remaining_seconds--;
}

function timer_button_touchend_handler()
{
    if(!timer_hold_timer) return;

    clearTimeout(timer_hold_timer);
    timer_hold_timer = null;

    if(timer_update_timer)
    {
        clearInterval(timer_update_timer);
        timer_update_timer = null;
        $("#timer_button").animate({ borderWidth: "3px" }, 300).html("Timer");
    }

    else
    {
        $("#timer_button").animate({ borderWidth: "0px" }, 300);
        timer_remaining_seconds = timer_minutes * 60;
        timer_update_timer = setInterval(timer_update, 1000);
        timer_update();
    }

    return false;
}

// --------------------------------------------------------------------------------
// history

var history_edited_flag = false;

function history_button_touchstart_handler()
{
    var $list_dom, mail_content;

    history_edited_flag = false;

    $(this).fadeTo(300, 0.3);
    $("#history_screen").slideDown(300).css("display", "table");

    $list_dom = $("#history_screen ul");
    mail_content = "";
    for(var i = 0; i < lp_history.length; i++)
    {
        var side = lp_history[i].side;
        var diff = lp_history[i].diff;
        $("<li>")
            .addClass(side == 0 ? "player" : side == 1 ? "opponent" : "both")
            .html(diff)
            .hide()
            .appendTo($list_dom)
            .bind("touchstart", history_entry_touchstart_handler)
            .bind("touchmove", history_entry_touchmove_handler)
            .bind("touchend", history_entry_touchend_handler)
            .delay(i * 50)
            .show(300);
        mail_content += (side == 0 ? "< " : side == 1 ? "> " : "! ") + diff + "\n";
    }
    $("#history_mail")
        .attr("href", "mailto:?subject=Duel Log&body=" + encodeURI(mail_content));

    return false;
}

function history_close_touchstart_handler()
{
    var $entries = $("#history_screen ul li");
    var elems_count = $entries.length, i = 0;

    if(elems_count == 0){
        $("#history_screen").slideUp(300, function(){
            if(history_edited_flag)
                lp_recalculate_whole_history();
            $("#history_button").fadeTo(300, 0.9);
        });
    }

    else{
        $entries.each(function(){
            $(this).delay((i++) * 50).hide(300, function(){
                $(this).remove();
                if(--elems_count == 0)
                    $("#history_screen").slideUp(300, function(){
                        if(history_edited_flag)
                            lp_recalculate_whole_history();
                        $("#history_button").fadeTo(300, 0.9);
                    });
            });
        });
    }

    return false;
}

function history_screen_touchstart_handler(e)
{
    startY = touch_get_y(e);
    startTop = $(window).scrollTop();
    return false;
}

function history_screen_touchmove_handler(e)
{
    $(window).scrollTop(startTop - (touch_get_y(e) - startY));
    return false;
}

function history_entry_touchstart_handler(e)
{
    dragging_flag = false;
    scrolling_flag = false;
    startX = touch_get_x(e);
    startY = touch_get_y(e);
    startTop = $(window).scrollTop();
    return false;
}

function history_entry_touchmove_handler(e)
{
    var left, right;

    currentX = touch_get_x(e);
    currentY = touch_get_y(e);

    if(scrolling_flag)
        $(window).scrollTop(startTop - (currentY - startY));

    else if(dragging_flag)
    {
        left = 200 + (currentX - startX);
        right = 200 - (currentX - startX);
        $(this).css({ marginLeft: left, marginRight: right });

        if(left <= 20 || right <= 20)
            $(this).unbind()
            .hide(300, function(){
                if(dragging_flag){
                    dragging_flag = false;
                    history_edited_flag = true;
                    lp_history.splice($(this).index(), 1);
                    $(this).remove;
                }
            });
    }

    else if(Math.abs(currentX - startX) > 10)
        dragging_flag = true;

    else if(Math.abs(currentY - startY) > 10)
        scrolling_flag = true;

    return false;
}

function history_entry_touchend_handler()
{
    if(dragging_flag){
        dragging_flag = false;
        $(this).animate({ marginLeft: 200, marginRight: 200 }, 300);
        return false;
    }
}

// --------------------------------------------------------------------------------
// yu-jo

function yujo_button_touchstart_handler()
{
    lp_increase(2, "Yu-Jo");
    return false;
}

// --------------------------------------------------------------------------------
// dice / coin

function animation_screen_touchstart_handler()
{
    animation_stop();

    $("#animation_screen").hide(300, function(){
        $("#animation_screen .cell").empty();
        $("#dice_button,#coin_button").fadeTo(300, 0.9);
    });

    return false;
}

function dice_button_touchstart_handler()
{
    $(this).fadeTo(300, 0.3);
    $("#animation_screen").show();
    dice_initialize(
        $("#animation_screen .cell"),
        $("#main_screen").width(),
        $("#main_screen").height()
    );

    return false;
}

function coin_button_touchstart_handler()
{
    $(this).fadeTo(300, 0.3);
    $("#animation_screen").show();
    coin_initialize(
        $("#animation_screen .cell"),
        $("#main_screen").width(),
        $("#main_screen").height()
    );

    return false;
}

// --------------------------------------------------------------------------------
// initial screen

function hideshow_initial_screen()
{
    if(touch_available_p() && $(window).height() < $(window).width())
        $("#initial_screen").fadeOut(300);
    else
        $("#initial_screen").fadeIn(300);
}

function get_ads()
{
    $(".tdftad").appendTo($("#ad_row .cell"))
}


// --------------------------------------------------------------------------------

$(document).ready(function(){
    $(".panel").bind("touchstart", function(){ return false; });
    $("#diff_screen").hide();
    $("#grid_screen").hide();
    $("#animation_screen").hide()
        .bind("touchstart", animation_screen_touchstart_handler);
    $("#history_screen").hide()
        .bind("touchstart", history_screen_touchstart_handler)
        .bind("touchmove", history_screen_touchmove_handler);
    $("#history_screen .closebtn")
        .bind("touchstart", history_close_touchstart_handler);
    $("#main_screen .lp")
        .bind("touchstart", lp_touchstart_handler)
        .bind("touchmove", lp_touchmove_handler)
        .bind("touchend", lp_touchend_handler);
    $("#history_button")
        .bind("touchstart", history_button_touchstart_handler);
    $("#timer_button")
        .bind("touchstart", timer_button_touchstart_handler)
        .bind("touchend", timer_button_touchend_handler);
    $("#yujo_button")
        .bind("touchstart", yujo_button_touchstart_handler);
    $("#dice_button")
        .bind("touchstart", dice_button_touchstart_handler);
    $("#coin_button")
        .bind("touchstart", coin_button_touchstart_handler);
    get_ads();
});

$(window).ready(hideshow_initial_screen);
$(window).resize(hideshow_initial_screen);
