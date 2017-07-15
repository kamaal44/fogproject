$(function() {
    var vers = $('.placehere').attr('vers');
    validatorOpts = {
        submitHandler: submithandlerfunc
    };
    setInterval(function() {
        $('button[name="update"], button[type="submit"]:not(#importbtn, #export, #upload), #menuSet, #hideSet, #exitSet, #advSet, button[name="saveform"], button[name="delform"], #deletecu').each(function(e) {
            if ($(this).is(':visible')) {
                $(this).on('click', function(e) {
                    data = this.name;
                    form = $(this).parents('form');
                    validator = form.validate(validatorOpts);
                });
            }
        });
    }, 1000);
    $.ajax({
        url: '../status/mainversion.php',
        dataType: 'json',
        success: function(data) {
            $('.placehere').append(data);
        },
        error: function() {
            $('.placehere').append('Failed to get latest info');
        }
    });
    $('.kernvers').each(function() {
        URL = $(this).attr('urlcall');
        test = document.createElement('a');
        test.href = URL;
        test2 = '../'+test.pathname+test.search;
        $.ajax({
            context: this,
            url: test2,
            type: 'POST',
            data: {
                url: URL
            },
            success: function(data) {
                if (typeof(data) == null
                    || typeof(data) == 'undefined'
                ) {
                    $(this).text('No data returned');
                }
                data = data.split('\n');
                if (data.length < 2) {
                    $(this).text('No data returned');
                    return;
                }
                var nodevers = data.shift();
                $(this).text(data.join('\n'));
                var setter = $(this).parents('div.hidefirst').prev('a').find('.kernversionupdate');
                var nodename = setter.text();
                setter.text(nodename.replace(/\(.*\)/,'('+nodevers+')'));
            }
        });
    });
    $('#bannerimg').click(function(e) {
        e.preventDefault();
        $('input[name="banner"]').val('');
        name = $(this).attr('identi');
        $('#uploader').html('<input type="file" name="'+name+'" class="newbanner"/>').find('input').click();
    });
    $(document).on('change', '.newbanner', function(e) {
        filename = this.value;
        filename = filename.replace(/\\/g, '/').replace(/.*\//, "");
        $('input[name="banner"]').val(filename);
    });
    $('.resettoken').click(function(e) {
        e.preventDefault();
        $.ajax({
            url: '../status/newtoken.php',
            dataType: 'json',
            success: function(data) {
                $('.token').val(data);
            }
        });
    });
});
