var isInViewport = function (elem) {
    var distance = elem.getBoundingClientRect();
    return (
        distance.top >= 0 &&
        distance.left >= 0 &&
        distance.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        distance.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

window.onload =  function () {
    var arr = [];
    document.querySelectorAll("[id^='term']").forEach(x => arr.push(x));

    var startVisibleTerm = function () {
        arr.filter(x => isInViewport(x)).forEach(x => {
            new Termynal('#' + x.id);
        })
        arr = arr.filter(x => !isInViewport(x))
    };

    var version = document.querySelectorAll('.latest_release_version')
    if (version.length > 0) {
        fetch('https://api.github.com/repos/FACT-Finder/snage/releases').then(resp => resp.json()).then(resp => {
            var current = resp[0].tag_name.slice(1);
            version.forEach(x => x.innerHTML = current);
        });
    }

    window.addEventListener('scroll', startVisibleTerm, false);
    startVisibleTerm();
}
