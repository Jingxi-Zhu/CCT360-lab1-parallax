window.addEventListener("load", function () {
    const page = document.documentElement;
    const sections = document.querySelectorAll(".section");
    const background = document.getElementById("background");
    const progressBar = document.getElementById("progress-bar");
    const motionButton = document.getElementById("motion-toggle");
    const snake = document.getElementById("snake");
    const spider = document.getElementById("spider");
    const viewImage = document.querySelector("#section-5 .photo img");
    const routePhoto = document.getElementById("route-photo");
    const routeCaption = document.getElementById("route-caption");
    const routeButtons = document.getElementById("route-buttons");
    const outwardButton = document.getElementById("show-outward");
    const returnButton = document.getElementById("show-return");
    const warningImage = document.querySelector("#section-2 .photo img");
    const rocksImage = document.querySelector("#section-4 .photo img");

    const required = [background, progressBar, motionButton, snake, spider,
        viewImage, routePhoto, routeCaption, routeButtons, outwardButton,
        returnButton, warningImage, rocksImage];

    if (required.some(function (item) { return !item; })) {
        console.error("Check the element IDs in index.html.");
        return;
    }

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let paused = false;
    let framePending = false;

    function motionIsOff() {
        return paused || motionPreference.matches;
    }

    // Override the old one-time CSS animations, not the page layout.
    [snake, spider].forEach(function (animal) {
        animal.style.animation = "none";
        animal.style.opacity = "0";
        animal.style.bottom = "auto";
        animal.style.padding = "8px";
        animal.style.borderRadius = "50%";
        animal.style.backgroundColor = "rgba(255, 253, 248, 0.94)";
        animal.style.boxShadow = "0 5px 18px rgba(25, 70, 60, 0.25)";
    });

    snake.style.fontSize = "82px";
    spider.style.fontSize = "48px";

    // Keep stars inside a separate layer so they cannot widen the page.
    const starLayer = document.createElement("div");
    starLayer.setAttribute("aria-hidden", "true");
    starLayer.style.cssText = "position:absolute; inset:0; overflow:hidden;" +
        "pointer-events:none; z-index:3; border-radius:10px;";
    viewImage.parentElement.appendChild(starLayer);

    // Six small stars, placed around the view rather than over the person.
    const starPositions = [
        [0.12, 0.18],
        [0.87, 0.24],
        [0.08, 0.48],
        [0.92, 0.56],
        [0.16, 0.80],
        [0.84, 0.85]
    ];

    const stars = starPositions.map(function () {
        const star = document.createElement("span");
        star.textContent = "✦";
        star.setAttribute("aria-hidden", "true");
        star.style.cssText = "position:absolute; z-index:3; opacity:0;" +
            "pointer-events:none; font-size:36px; line-height:1;" +
            "color:#fff2b8; text-shadow:0 0 8px white, 0 1px 5px #716039;";
        starLayer.appendChild(star);
        return star;
    });

    const effects = [
        { image: warningImage, animal: snake, active: false, animations: [] },
        { image: rocksImage, animal: spider, active: false, animations: [] },
        { image: viewImage, animal: null, active: false, animations: [] }
    ];

    function stopEffect(effect) {
        effect.animations.forEach(function (animation) {
            animation.cancel();
        });
        effect.animations = [];
    }

    function playAnimal(effect) {
        const image = effect.image;
        const animal = effect.animal;
        const rect = image.getBoundingClientRect();
        const size = animal.offsetWidth;
        const distance = Math.max(0, image.clientWidth - size - 28);

        // Keep the animal inside the part of the photo currently on screen.
        const visibleTop = Math.max(rect.top, 70);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight - 40);
        const middle = visibleTop + (visibleBottom - visibleTop) * 0.6;
        const top = Math.max(12, Math.min(image.clientHeight - size - 12,
            middle - rect.top - size / 2));

        animal.style.top = (image.offsetTop + top) + "px";
        animal.style.left = (image.offsetLeft + 12) + "px";

        effect.animations.push(animal.animate([
            {
                opacity: 0,
                transform: "translate(0, 0) scale(0.8)"
            },
            {
                opacity: 1,
                transform: "translate(8px, -5px) scale(1)",
                offset: 0.12
            },
            {
                opacity: 1,
                transform: "translate(" + distance * 0.5 + "px, -12px) rotate(-10deg)",
                offset: 0.5
            },
            {
                opacity: 1,
                transform: "translate(" + distance + "px, 0) rotate(8deg)",
                offset: 0.85
            },
            {
                opacity: 0,
                transform: "translate(" + distance + "px, 0) scale(0.8)"
            }
        ], {
            duration: animal === snake ? 6500 : 4800,
            easing: "linear"
        }));
    }

    function playView(effect) {
        const normalShadow = getComputedStyle(viewImage).boxShadow;

        effect.animations.push(viewImage.animate([
            {
                transform: "scale(1)",
                boxShadow: normalShadow
            },
            {
                transform: "scale(1.025)",
                offset: 0.45,
                boxShadow: "0 0 0 4px rgba(255,235,166,0.7), 0 0 48px rgba(255,240,181,0.85)"
            },
            {
                transform: "scale(1)",
                boxShadow: normalShadow
            }
        ], {
            duration: 4800,
            easing: "ease-in-out"
        }));

        stars.forEach(function (star, index) {
            star.style.left =
                (viewImage.offsetLeft + viewImage.offsetWidth * starPositions[index][0]) + "px";
            star.style.top =
                (viewImage.offsetTop + viewImage.offsetHeight * starPositions[index][1]) + "px";

            effect.animations.push(star.animate([
                {
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(0.3) rotate(0deg)"
                },
                {
                    opacity: 1,
                    transform: "translate(-50%, -65%) scale(1.15) rotate(12deg)",
                    offset: 0.45
                },
                {
                    opacity: 0,
                    transform: "translate(-50%, -100%) scale(0.5) rotate(25deg)"
                }
            ], {
                duration: 2400,
                delay: 350 + index * 300,
                easing: "ease-in-out"
            }));
        });
    }

    function updatePage() {
        const height = window.innerHeight;
        const scrollDistance = page.scrollHeight - height;
        const progress = scrollDistance > 0
            ? Math.max(0, Math.min(1, window.scrollY / scrollDistance)) : 0;
        const off = motionIsOff() || document.hidden;

        progressBar.style.width = (progress * 100) + "%";
        background.style.transform = off ? "none"
            : "translateY(" + (progress * -40) + "px)";

        sections.forEach(function (section) {
            if (section.getBoundingClientRect().top < height * 0.85) {
                section.classList.add("is-visible");
            }
        });

        effects.forEach(function (effect) {
            const rect = effect.image.getBoundingClientRect();
            const visibleHeight =
                Math.min(rect.bottom, height - 40) - Math.max(rect.top, 70);
            const outside = rect.bottom <= 0 || rect.top >= height;
            const needed = effect.animal
                ? Math.min(180, rect.height * 0.45)
                : Math.min(height * 0.6, rect.height * 0.55);

            // Leaving the screen resets the effect so it can play again.
            if (off || outside) {
                stopEffect(effect);
                effect.active = false;
            } else if (!effect.active && visibleHeight > needed) {
                stopEffect(effect);
                effect.active = true;

                if (effect.animal) {
                    playAnimal(effect);
                } else {
                    playView(effect);
                }
            }
        });
    }

    function scheduleUpdate() {
        if (!framePending) {
            framePending = true;
            requestAnimationFrame(function () {
                framePending = false;
                updatePage();
            });
        }
    }

    // Pause removes decoration. Play restarts effects in the current view.
    function applyMotionSettings() {
        const off = motionIsOff();

        page.classList.toggle("reduce-motion", off);
        motionButton.setAttribute("aria-pressed", String(off));
        motionButton.disabled = motionPreference.matches;
        motionButton.textContent = motionPreference.matches
            ? "Animations off (device setting)"
            : (paused ? "Play animations" : "Pause animations");

        effects.forEach(function (effect) {
            stopEffect(effect);
            effect.active = false;
        });

        updatePage();
    }

    motionButton.addEventListener("click", function () {
        paused = !paused;
        applyMotionSettings();
    });

    motionPreference.addEventListener("change", applyMotionSettings);
    motionButton.hidden = false;

    // Keep the outward / return photo comparison.
    function showRoute(outward) {
        routePhoto.src = outward
            ? "images/03-trail.jpg"
            : "images/06-return.jpg";

        routePhoto.alt = outward
            ? "A narrow forest path with fallen branches and uneven ground."
            : "A clearer gravel path between trees on the return walk.";

        routeCaption.textContent = outward
            ? "The way there: the more challenging path."
            : "The way back: a much clearer path.";

        outwardButton.setAttribute("aria-pressed", String(outward));
        returnButton.setAttribute("aria-pressed", String(!outward));
        scheduleUpdate();
    }

    outwardButton.addEventListener("click", function () {
        showRoute(true);
    });

    returnButton.addEventListener("click", function () {
        showRoute(false);
    });

    routePhoto.addEventListener("load", scheduleUpdate);
    routeButtons.hidden = false;

    document.addEventListener("scroll", scheduleUpdate, { passive: true });
    document.addEventListener("visibilitychange", scheduleUpdate);

    window.addEventListener("resize", function () {
        effects.forEach(function (effect) {
            stopEffect(effect);
            effect.active = false;
        });
        scheduleUpdate();
    });

    applyMotionSettings();
    page.classList.add("js-ready");
});