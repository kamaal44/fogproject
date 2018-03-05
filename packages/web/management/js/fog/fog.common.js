var $_GET = getQueryParams(document.location.search),
    Common = {
        node: $_GET['node'],
        sub: $_GET['sub'],
        id: $_GET['id'],
        tab: $_GET['tab'],
        search: $_GET['search'],
        masks: {
            'mac': "##:##:##:##:##:##",
            'productKey': "*****-*****-*****-*****-*****",
            'hostname': "",
            'username': '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
        }
    };

(function($) {
    Pace.options = {
        ajax: false,
        restartOnRequestAfter: false
    };
    PNotify.prototype.options.styling = "fontawesome";

    // Extending input mask to add our types
    $.extend($.inputmask.defaults.definitions, {
        '^': {
            validator: "[A-Za-z0-9\_\.]",
            cardinality: 1
        },
        '#': {
            validator: "[A-Fa-f0-9]",
            cardinality: 1
        }
    });


    var uniSearchForm = $('#universal-search-form');
    var uniSearchField = $('#universal-search-field');
    var uniSearchButton = $('#universal-search-btn');
    var uniSearchResults = $('#universal-search-results');

    var uniSearchTimer = 0;

    if (Common.node !== undefined && Common.node.length != 0 && Common.node !== 'home') {
        $(document).ajaxStart(function() { Pace.restart(); });
    }

    $("body").on('click',function(e) {
        if(e.target !== uniSearchResults &&
            e.target !== uniSearchForm &&
            !uniSearchResults.has(e.target).length &&
            !uniSearchForm.has(e.target).length) {

            if (uniSearchResults.hasClass("open")) {
                uniSearchResults.removeClass("open");
                uniSearchResults.children().remove();
            }
        }
    });

    var processSearch = function(res, query) {

        var lang = res._lang;
        var isResult = false;

        var list = $('<ul style="width: 100%;"></ul>');

        for (var key in res) {
            if (!res.hasOwnProperty(key)) continue;
            if (key.startsWith("_")) continue;

            var obj = res[key];
            if (obj.length == 0) continue;
            isResult = true;
            var objHeader = $('<li class=""></li>');
            objHeader.append('<a href="#">' + Common.capitalizeFirstLitter(lang[key]) + '</a>');
            list.append(objHeader);
            var objList = $('<ul class="menu"></ul>');
            objHeader.append(objList);

            for (var i = 0; i < obj.length; i++) {
                var item = obj[i];
                var linkHtml = '<a href="' + '../management/index.php?node=' + key + '&sub=edit&id=' + item.id + '">' + item.name + '</a>';
                objList.append('<li>' +linkHtml + '</li>')
            }
            if (obj.length != res._results[key]) {
                var linkHtml = '<a href="' + '../management/index.php?node=' + key + '&sub=list&search=' + query+ '">See all results</a>';
                objList.append('<li>' +linkHtml + '</li>')
            }
        }

        uniSearchResults.children().remove();
        if (!isResult) {
            list = $('<center><a href="#">No Results</a></center>');
        }
        uniSearchResults.append(list);
        if (!uniSearchResults.hasClass("open")) {
            uniSearchResults.addClass("open");
        }
    };

    var handleQueryChange = function() {
        // Use a timer to only search once the user
        //  stops typing
        clearTimeout(uniSearchTimer);
        uniSearchTimer = setTimeout(function() {
            var query = uniSearchField.val();
            if (query.length == 0) {
                if (uniSearchResults.hasClass("open")) {
                    uniSearchResults.removeClass("open");
                    uniSearchResults.children().remove();
                }
                return;
            }
            var opts = {
                search: query
            };
            Pace.track(function(){
                $.ajax('', {
                    type: uniSearchForm.attr('method'),
                    url: uniSearchForm.attr('action') + '/' + query + '/' + 5,
                    async: true,
                    data: opts,
                    dataType: 'json',
                    success: function(res) {
                        processSearch(res, opts.search);
                    },
                    error: function(res) {
                        Common.notifyFromAPI(res.responseJSON, true);
                    }
                });
            });
        }, 100);
    }

    uniSearchForm.on('submit',function(e) {
        e.preventDefault();
    });

    uniSearchField.on('input', handleQueryChange);
    uniSearchButton.on('click',function (e) {
        if (!uniSearchResults.hasClass("open")) {
            handleQueryChange();
        }
    });

    // https://stackoverflow.com/a/1026087
    Common.capitalizeFirstLitter = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    Common.notify = function(title, body, type) {
        new PNotify({
            title: title,
            text: body,
            type: type
        });
    };
    Common.notifyFromAPI = function(res, isError) {
        if (res === undefined) {
            res = {};
        }
        Common.notify(
            res.title || 'Bad Response',
            (isError ? res.error : res.msg) || 'Bad Response',
            (isError ? 'error' : 'success')
        );
    };
    Common.validateForm = function(form) {
        var scrolling = false;
        var isError = false;
        form.find(":input").each(function(i, e) {
            var isValid = true;
            var invalidReason = undefined;

            // Grab the parent form-group, as we will need it to visually mark
            //   invalid fields
            var parent = $(e).closest('div[class^="form-group"]');;
            var required = $(e).prop('required');
            var val = $(e).inputmask('unmaskedvalue');
            if(required) {
                if (val.length == 0) {
                    isValid = false;
                    invalidReason = 'Field is required';
                }
            }

            if (required || val.length > 0) {
                var minLength = $(e).attr("minlength") || "-1";
                var maxLength = $(e).attr("maxlength") || "-1";
                var exactLength = $(e).attr("exactlength") || "-1";

                minLength = parseInt(minLength);
                maxLength = parseInt(maxLength);
                exactLength = parseInt(exactLength);
                if (beEqualTo) beEqualTo = "#" + beEqualTo;

                if (val.length < minLength) {
                    isValid = false;
                    if (maxLength == minLength) {
                        invalidReason = 'Field must be ' + minLength + ' characters';
                    } else {
                        invalidReason = 'Field must be between ' + minLength + ' and ' + maxLength +' characters';
                    }
                } else if (exactLength > 0) {
                    if (val.length !== exactLength) {
                        isValid = false;
                        invalidReason = 'Field is incomplete';
                    }
                }
            }

            equalCheck: if (isValid) {
                var beEqualTo = $(e).attr("beEqualTo");
                if (!beEqualTo) break equalCheck;

                if (! $("#" + beEqualTo).length) {
                    console.log("Missing target " + beEqualTo + " for " + e);
                    break equalCheck;
                }
                var target = $("#" + beEqualTo);
                if ($(e).val() !== target.val()) {
                    isValid = false;
                    invalidReason = 'Field does not match';
                }
            }

            if (parent.hasClass('has-error')) {
                var possibleHelpblock = $(e).next('span');
                if (possibleHelpblock.hasClass('help-block')) {
                    possibleHelpblock.remove();
                }
                if (isValid) {
                    parent.removeClass('has-error');
                }
            } else if (!isValid) {
                parent.addClass('has-error');
            }

            if (isValid) {
                return;
            }

            if (!scrolling) {
                scrolling = true;
                $('html, body').animate({
                    scrollTop: parent.offset().top
                }, 200);
            }

            var msgBlock = '<span class="help-block">' + invalidReason + '</span>'
            $(msgBlock).insertAfter(e)
            isError = true;
        });

        return !isError;
    },
    Common.apiCall = function(method, url, opts, cb) {
        Pace.track(function(){
            $.ajax('', {
                type: method,
                url: url,
                async: true,
                data: opts,
                success: function(res) {
                    Common.notifyFromAPI(res, false);
                    if (cb && typeof(cb) === 'function') {
                        cb();
                    }
                },
                error: function(res) {
                    Common.notifyFromAPI(res.responseJSON, true);
                    if (cb && typeof(cb) === 'function') {
                        cb(res);
                    }
                }
            });
        });
    }
    Common.processForm = function(form, cb) {
        if(!Common.validateForm(form)) {
            if (cb && typeof(cb) === 'function')
                cb('invalid');
            return;
        }
        var method = form.attr('method'),
            action = form.attr('action'),
            opts = form.serialize();
        Common.apiCall(method,action,opts,cb);
    };
    Common.massExport = function(password, cb) {
        var opts = {
            fogguipass: password
        };
        Pace.track(function() {
            $.ajax('', {
                type: 'POST',
                url: '../management/export.php?type='+Common.node,
                async: true,
                data: opts,
                success: function(res) {
                    Common.notifyFromAPI(res, false);
                    if (cb && typeof(cb) === 'function') {
                        cb();
                    }
                },
                error: function(res) {
                    if (res.status == 401) {
                        if (cb && typeof(cb) === 'function') {
                            cb(res);
                        }
                    } else {
                        Common.notifyFromAPI(res.responseJSON, true);
                        if (cb && typeof(cb) === 'function') {
                            cb(res);
                        }
                    }
                }
            });
        });
    };
    Common.massDelete = function(password, cb, table, remIds) {
        if(!remIds) {
            remIds = [];
        }

        var rows = undefined;

        if (table === undefined) {
            remIds = [Common.id];
        } else {
            rows = table.rows({selected: true});
            remIds = rows.ids().toArray();
        }

        var opts = {
            fogguipass: password,
            confirmdel: 1,
            remitems: remIds
        };

        Pace.track(function(){
            $.ajax('', {
                type: 'post',
                url: '../management/index.php?node='
                + Common.node
                + '&sub=deletemulti',
                async: true,
                data: opts,
                success: function(res) {
                    if (table !== undefined) {
                        rows.remove().draw(false);
                        table.rows({selected: true}).deselect();
                    }
                    Common.notifyFromAPI(res, false);
                    if (cb && typeof(cb) === 'function') {
                        cb();
                    }
                },
                error: function(res) {
                    if (res.status == 401) {
                        if (cb && typeof(cb) === 'function') {
                            cb(res);
                        }
                    } else {
                        Common.notifyFromAPI(res.responseJSON, true);
                        if (cb && typeof(cb) === 'function') {
                            cb(res);
                        }
                    }
                }
            });
        });
    };
    Common.registerTable = function(e, onSelect, opts) {
        if (opts === undefined) {
            opts = {};
        }
        if (opts.paging === undefined) {
            opts.paging = true;
        }
        if (opts.lengthChange === undefined) {
            opts.lengthChange = true;
        }
        if (opts.pagingType === undefined) {
            opts.pagingType = "simple_numbers";
        }
        if (opts.searching === undefined) {
            opts.searching = true;
        }
        if (opts.ordering === undefined) {
            opts.ordering = true;
        }
        if (opts.info === undefined) {
            opts.info = true;
        }
        if (opts.stateSave === undefined) {
            opts.stateSave = false; // MAYBE???
        }
        if (opts.autoWidth === undefined) {
            opts.autoWidth = false;
        }
        if (opts.select === undefined) {
            opts.select = {
                style: 'multi+shift',
            }
        }
        if (opts.responsive === undefined) {
            opts.responsive = true;
        }
        if (opts.dom === undefined) {
             opts.dom = "<'row'<'col-sm-6'l><'col-sm-6'f>>B" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>";
        }
        if (opts.buttons === undefined) {
            if (opts.select) {
                opts.buttons = [
                    //'copy',
                    //'excel',
                    //'pdf',
                    //'print',
                    //'selected',
                    'selectAll',
                    'selectNone'
                ];
            }
        }
        var table = e.DataTable(opts);

        if (onSelect !== undefined && typeof(onSelect) === 'function') {
            table.on('select deselect', function( e, dt, type, indexes) {
                onSelect(dt.rows({selected: true}));
            });
        }

        return table;
    };
    Common.getSelectedIds = function(table) {
        var rows = table.rows({selected: true});
        return rows.ids().toArray();
    };

    //Initialize Select2 Elements
    $('.select2').select2({
        width: '100%'
    });

    Common.iCheck = function(match) {
        match = match || 'input'
        $(match).iCheck({
            checkboxClass: 'icheckbox_square-blue',
            radioClass: 'iradio_square-blue',
            increaseArea: '20%' // optional
        });
    }
    Common.iCheck();

    $(":input").inputmask();
    $(':password')
    .not('.fakes, [name="upass"]')
    .before('<span class="input-group-addon"><i class="fa fa-eye-slash fogpasswordeye"></i></span>');
    $(document).on('click', '.fogpasswordeye', function(e) {
        e.preventDefault();
        if (!$(this).hasClass('clicked')) {
            $(this)
                .addClass('clicked')
                .removeClass('fa-eye-slash')
                .addClass('fa-eye')
                .closest('.input-group')
                .find('input[type="password"]')
                .prop('type', 'text');
        } else {
            $(this)
                .removeClass('clicked')
                .addClass('fa-eye-slash')
                .removeClass('fa-eye')
                .closest('.input-group')
                .find('input[type="text"]')
                .prop('type', 'password');
        }
    }).on('change', ':file', function() {
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input
                .val()
                .replace(/\\/g, '/')
                .replace(/.*\//, '');
        input.trigger('fileselect', [numFiles, label]);
        /**
         * If only one file display the value in the text field.
         * Otherwise show the number of files selected.
         */
        if (numFiles == 1) {
            $('.filedisp').val(label);
        } else {
            $('.filedisp').val(numFiles + ' files selected');
        }
    }).on('mouseover', function() {
        $('[data-toggle="tooltip"').tooltip({
            container: 'body'
        });
    });
})(jQuery);
/**
 * Gets the GET params from the URL.
 */
function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},tokens,re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
}