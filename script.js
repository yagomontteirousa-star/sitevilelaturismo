const phoneNumber = "5564992674223";
const siteOriginMessage = "Olá, vim pelo site da Vilela Turismo.";
const defaultMessage =
  "Olá, quero cotar uma passagem aérea com a Vilela Turismo. Pode me ajudar com destino, datas e número de passageiros?";

function buildWhatsAppUrl(message = defaultMessage) {
  const messageWithoutGreeting = message.replace(/^Olá,\s*/i, "");
  const normalizedMessage = `${messageWithoutGreeting.charAt(0).toUpperCase()}${messageWithoutGreeting.slice(1)}`;
  const completeMessage = `${siteOriginMessage} ${normalizedMessage}`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(completeMessage)}`;
}

function updateWhatsAppLinks() {
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const message = link.dataset.message || defaultMessage;
    link.href = buildWhatsAppUrl(message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function setupHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!header) return;

  const updateHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  const closeNav = () => {
    toggle?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-visible");
    header.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  toggle?.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeNav();
      return;
    }

    toggle.setAttribute("aria-expanded", "true");
    nav?.classList.add("is-visible");
    header.classList.add("is-open");
    document.body.classList.add("nav-open");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (toggle?.getAttribute("aria-expanded") !== "true") return;
    const clickedElement = event.target instanceof Element ? event.target : null;
    if (!clickedElement || header.contains(clickedElement)) return;
    closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
}

function setupSmoothAnchors() {
  // A rolagem suave entre seções é 100% nativa via CSS:
  //   html { scroll-behavior: smooth; scroll-padding-top: var(--anchor-offset); }
  //   section[id] { scroll-margin-top: var(--anchor-offset); }
  // Não usamos animação manual em JS: window.scrollTo() quadro a quadro
  // conflita com o scroll-behavior do navegador e causa saltos/travadas.
  // Aqui só garantimos que âncoras para alvos inexistentes não quebrem
  // e que links "#" puros (placeholders) não pulem para o topo.
  document.addEventListener("click", (event) => {
    const clickedElement = event.target instanceof Element ? event.target : null;
    const link = clickedElement?.closest('a[href="#"]');
    if (link) event.preventDefault();
  });
}

function setupHeroSlider() {
  const slider = document.querySelector("[data-hero-slider]");
  if (!slider) return;

  let slides = Array.from(slider.querySelectorAll(".hero-slide"));
  let currentIndex = Math.max(slides.findIndex((slide) => slide.classList.contains("is-active")), 0);
  let timer;

  const refreshSlides = () => {
    slides = Array.from(slider.querySelectorAll(".hero-slide"));
  };

  const orderSlides = () => {
    refreshSlides();
    if (slides.length < 3) return;

    const firstSlide = slides.find((slide) => slide.classList.contains("is-active")) || slides[0];
    const teamSlide = slides.find((slide) => slide.dataset.heroFocus === "team" && slide !== firstSlide);
    const orderedSlides = [
      firstSlide,
      ...(teamSlide ? [teamSlide] : []),
      ...slides.filter((slide) => slide !== firstSlide && slide !== teamSlide),
    ];

    orderedSlides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === 0);
      slider.appendChild(slide);
    });

    refreshSlides();
    currentIndex = 0;
  };

  const goToSlide = (index) => {
    refreshSlides();
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });
  };

  const nextSlide = () => goToSlide(currentIndex + 1);

  const stopSlider = () => {
    if (!timer) return;
    window.clearInterval(timer);
    timer = undefined;
  };

  const startSlider = () => {
    if (timer || slides.length < 2) return;
    timer = window.setInterval(nextSlide, 3800);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSlider();
    } else {
      startSlider();
    }
  });

  orderSlides();
  goToSlide(currentIndex);
  startSlider();
}


function setupQuoteForm() {
  const form = document.querySelector("[data-quote-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const destino = formData.get("destino")?.toString().trim();
    const ida = formatDateValue(formData.get("ida")?.toString().trim());
    const volta = formatDateValue(formData.get("volta")?.toString().trim());
    const passageiros = formData.get("passageiros")?.toString().trim();

    // Só inclui na mensagem os campos que foram preenchidos.
    const linhas = ["Olá, quero cotar uma passagem aérea com a Vilela Turismo.", ""];
    if (destino) linhas.push(`Destino: ${destino}`);
    if (ida) linhas.push(`Ida: ${ida}`);
    if (volta) linhas.push(`Volta: ${volta}`);
    if (passageiros) linhas.push(`Passageiros: ${passageiros}`);

    window.open(buildWhatsAppUrl(linhas.join("\n")), "_blank", "noopener,noreferrer");
  });
}

function formatDateValue(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function setupDatePickers() {
  const pickers = Array.from(document.querySelectorAll("[data-date-picker]"));
  if (!pickers.length) return;

  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const shortMonthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const pad = (value) => String(value).padStart(2, "0");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  };

  const toDateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const formatDisplayDate = (value) => {
    const date = parseDate(value);
    if (!date) return "Selecionar data";
    return `${pad(date.getDate())} ${shortMonthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isSameDay = (first, second) =>
    first &&
    second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  const closePicker = (picker) => {
    const toggle = picker.querySelector("[data-date-toggle]");
    picker.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  const closeOtherPickers = (activePicker) => {
    pickers.forEach((picker) => {
      if (picker !== activePicker) closePicker(picker);
    });
  };

  const idaInput = document.querySelector('.quote-date-ida [data-date-input]');
  const voltaPicker = document.querySelector('.quote-date-volta[data-date-picker]');

  pickers.forEach((picker) => {
    const toggle = picker.querySelector("[data-date-toggle]");
    const label = picker.querySelector("[data-date-label]");
    const input = picker.querySelector("[data-date-input]");
    const monthLabel = picker.querySelector("[data-date-month]");
    const grid = picker.querySelector("[data-date-grid]");
    const prev = picker.querySelector("[data-date-prev]");
    const next = picker.querySelector("[data-date-next]");
    if (!toggle || !label || !input || !monthLabel || !grid || !prev || !next) return;

    const isVolta = picker.classList.contains("quote-date-volta");

    // Datas anteriores a hoje ficam bloqueadas; na volta, anteriores à ida também.
    const getMinDate = () => {
      if (isVolta && idaInput) {
        const idaDate = parseDate(idaInput.value);
        if (idaDate && idaDate > today) return idaDate;
      }
      return today;
    };

    let selectedDate = parseDate(input.value);
    let viewDate = selectedDate ? new Date(selectedDate) : new Date(today);
    viewDate.setDate(1);

    const updateLabel = () => {
      label.textContent = formatDisplayDate(input.value);
    };

    const renderCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      monthLabel.textContent = `${monthNames[month]} de ${year}`;
      grid.innerHTML = "";

      for (let index = 0; index < firstDay; index += 1) {
        const empty = document.createElement("span");
        empty.className = "date-empty";
        grid.appendChild(empty);
      }

      const minDate = getMinDate();

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const value = toDateValue(date);
        const dayButton = document.createElement("button");
        dayButton.className = "date-day";
        dayButton.type = "button";
        dayButton.textContent = String(day);
        dayButton.setAttribute("aria-label", `${day} de ${monthNames[month]} de ${year}`);

        if (date < minDate) {
          dayButton.classList.add("is-disabled");
          dayButton.disabled = true;
        }

        if (isSameDay(date, today)) dayButton.classList.add("is-today");
        if (isSameDay(date, selectedDate)) {
          dayButton.classList.add("is-selected");
          dayButton.setAttribute("aria-pressed", "true");
        } else {
          dayButton.setAttribute("aria-pressed", "false");
        }

        dayButton.addEventListener("click", () => {
          selectedDate = date;
          input.value = value;
          updateLabel();
          renderCalendar();
          closePicker(picker);
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });

        grid.appendChild(dayButton);
      }
    };

    toggle.addEventListener("click", () => {
      const isOpen = picker.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      closeOtherPickers(picker);
      if (isOpen) renderCalendar();
    });

    prev.addEventListener("click", () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      renderCalendar();
    });

    next.addEventListener("click", () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      renderCalendar();
    });

    picker.resetSelection = () => {
      selectedDate = null;
      input.value = "";
      updateLabel();
      renderCalendar();
    };

    updateLabel();
    renderCalendar();
  });

  // Se a ida mudar para depois da volta selecionada, limpa a volta.
  idaInput?.addEventListener("change", () => {
    const voltaInput = voltaPicker?.querySelector("[data-date-input]");
    const idaDate = parseDate(idaInput.value);
    const voltaDate = parseDate(voltaInput?.value);
    if (idaDate && voltaDate && voltaDate < idaDate) {
      voltaPicker.resetSelection?.();
    }
  });

  document.addEventListener("click", (event) => {
    pickers.forEach((picker) => {
      if (!picker.contains(event.target)) closePicker(picker);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    pickers.forEach(closePicker);
  });
}

function setupPassengerPicker() {
  const picker = document.querySelector("[data-passenger-picker]");
  if (!picker) return;

  const toggle = picker.querySelector("[data-passenger-toggle]");
  const label = picker.querySelector("[data-passenger-label]");
  const input = picker.querySelector("[data-passenger-input]");
  const options = picker.querySelectorAll("[data-passenger-value]");

  const closePicker = () => {
    picker.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = picker.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((item) => item.classList.remove("is-selected"));
      option.classList.add("is-selected");
      input.value = option.dataset.passengerValue;
      label.textContent = option.textContent.trim();
      closePicker();
    });
  });

  document.addEventListener("click", (event) => {
    if (!picker.contains(event.target)) closePicker();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePicker();
  });
}

function setupReviewCarousel() {
  setupCarousel({
    rootSelector: "[data-review-carousel]",
    trackSelector: "[data-review-track]",
    prevSelector: "[data-review-prev]",
    nextSelector: "[data-review-next]",
    dotsSelector: "[data-review-dots]",
    cardSelector: ".review-card",
    dotLabel: "Ver avaliação",
    speed: 36,
  });
}

function setupCarousel({
  rootSelector,
  trackSelector,
  prevSelector,
  nextSelector,
  dotsSelector,
  cardSelector,
  dotLabel,
  speed = 36,
}) {
  const carousel = document.querySelector(rootSelector);
  if (!carousel) return;

  const track = carousel.querySelector(trackSelector);
  const prev = carousel.querySelector(prevSelector);
  const next = carousel.querySelector(nextSelector);
  const dotsWrap = carousel.querySelector(dotsSelector);
  if (!track || !dotsWrap) return;

  const getVisibleCards = () =>
    Array.from(track.querySelectorAll(`${cardSelector}:not([data-carousel-clone])`)).filter((card) => {
      return card.offsetParent !== null && getComputedStyle(card).display !== "none";
    });

  const originalCards = getVisibleCards();
  if (!originalCards.length) return;

  dotsWrap.innerHTML = "";

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canAutoplay =
    carousel.dataset.carouselAutoplay === "true" &&
    originalCards.length > 1 &&
    !reducedMotionQuery.matches;
  let animationFrame;
  let lastFrameTime = 0;
  let isPaused = false;
  let resumeTimer;
  let dots = [];
  let targets = [];
  let virtualScrollLeft = track.scrollLeft;

  // Clones só são necessários para o loop contínuo do autoplay.
  if (canAutoplay && !track.dataset.carouselPrepared) {
    originalCards.forEach((card, index) => {
      card.dataset.carouselIndex = `${index}`;
      const clone = card.cloneNode(true);
      clone.dataset.carouselClone = "true";
      clone.dataset.carouselIndex = `${index}`;
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
        input.removeAttribute("id");
      });
      clone.querySelectorAll("a, button, input, textarea, select, [contenteditable='true']").forEach((element) => {
        element.tabIndex = -1;
        if (element.hasAttribute("contenteditable")) {
          element.setAttribute("contenteditable", "false");
        }
      });
      track.appendChild(clone);
    });
    track.dataset.carouselPrepared = "true";
  }

  if (canAutoplay) {
    track.classList.add("is-marquee");
  }

  const getCardLeft = (card) => card.offsetLeft - track.offsetLeft;

  const getLoopWidth = () => {
    const firstClone = track.querySelector(`${cardSelector}[data-carousel-clone="true"]`);
    if (!firstClone) return 0;
    return Math.max(getCardLeft(firstClone), 0);
  };

  const getNormalizedScroll = () => {
    const loopWidth = getLoopWidth();
    if (!loopWidth) return track.scrollLeft;
    return track.scrollLeft % loopWidth;
  };

  const buildTargets = () => {
    const loopWidth = getLoopWidth();
    const positions = originalCards.map((card) => {
      return loopWidth ? Math.min(getCardLeft(card), loopWidth) : getCardLeft(card);
    });
    return positions.filter((position, index) => {
      return index === 0 || Math.abs(position - positions[index - 1]) > 4;
    });
  };

  const refreshTargets = () => {
    targets = buildTargets();
    if (!targets.length) targets = [0];
  };

  const getCurrentIndex = () => {
    refreshTargets();
    const scrollLeft = getNormalizedScroll();
    return targets.reduce((closestIndex, position, index) => {
      const currentDistance = Math.abs(targets[closestIndex] - scrollLeft);
      const newDistance = Math.abs(position - scrollLeft);
      return newDistance < currentDistance ? index : closestIndex;
    }, 0);
  };

  const updateDots = () => {
    const currentIndex = getCurrentIndex();
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const scrollToTarget = (index) => {
    refreshTargets();
    const safeIndex = (index + targets.length) % targets.length;
    virtualScrollLeft = targets[safeIndex];
    track.scrollTo({ left: targets[safeIndex], behavior: "smooth" });
    updateDots();
  };

  const stopAutoplay = () => {
    isPaused = true;
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = undefined;
    }
  };

  const startAutoplay = () => {
    refreshTargets();
    if (!canAutoplay || targets.length < 2) return;
    isPaused = false;
    if (animationFrame) return;
    animationFrame = window.requestAnimationFrame(animate);
  };

  const restartAutoplay = () => {
    lastFrameTime = 0;
    startAutoplay();
  };

  const resumeAutoplaySoon = (delay = 1200) => {
    if (!canAutoplay) return;
    if (resumeTimer) window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      virtualScrollLeft = getNormalizedScroll();
      restartAutoplay();
    }, delay);
  };

  const animate = (timestamp) => {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (!isPaused && canAutoplay) {
      const loopWidth = getLoopWidth();
      if (loopWidth > 0) {
        virtualScrollLeft += (delta / 1000) * speed;
        if (virtualScrollLeft >= loopWidth) {
          virtualScrollLeft -= loopWidth;
        }
        track.scrollLeft = virtualScrollLeft;
        updateDots();
      }
    }

    animationFrame = window.requestAnimationFrame(animate);
  };

  const renderDots = () => {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    dots = targets.map((_, index) => {
      const dot = document.createElement("button");
      dot.className = "review-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `${dotLabel} ${index + 1}`);
      dot.addEventListener("click", () => {
        scrollToTarget(index);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });
  };

  refreshTargets();
  renderDots();

  prev?.addEventListener("click", () => {
    stopAutoplay();
    scrollToTarget(getCurrentIndex() - 1);
    resumeAutoplaySoon();
  });
  next?.addEventListener("click", () => {
    stopAutoplay();
    scrollToTarget(getCurrentIndex() + 1);
    resumeAutoplaySoon();
  });
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", () => resumeAutoplaySoon(700));
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", () => resumeAutoplaySoon(500));
  track.addEventListener("pointerdown", stopAutoplay);
  track.addEventListener("pointerup", () => {
    virtualScrollLeft = track.scrollLeft;
    resumeAutoplaySoon();
  });
  track.addEventListener("pointercancel", () => resumeAutoplaySoon());
  track.addEventListener("pointerleave", () => {
    if (!carousel.matches(":hover")) resumeAutoplaySoon();
  });
  track.addEventListener("scroll", updateDots, { passive: true });
  window.addEventListener("resize", () => {
    refreshTargets();
    renderDots();
    virtualScrollLeft = getNormalizedScroll();
    updateDots();
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      lastFrameTime = 0;
      startAutoplay();
    }
  });

  updateDots();
  startAutoplay();
}

function setupClientCarousel() {
  setupCarousel({
    rootSelector: "[data-client-carousel]",
    trackSelector: "[data-client-track]",
    prevSelector: "[data-client-prev]",
    nextSelector: "[data-client-next]",
    dotsSelector: "[data-client-dots]",
    cardSelector: ".client-card",
    dotLabel: "Ver foto",
    speed: 42,
  });
}

function setupImageUploads(inputSelector, cardSelector, previewSelector, altText) {
  document.querySelectorAll(inputSelector).forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      const card = input.closest(cardSelector);
      const preview = card?.querySelector(previewSelector);
      if (!file || !preview) return;

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const carouselIndex = card?.dataset.carouselIndex;
        const previews = carouselIndex
          ? document.querySelectorAll(`${cardSelector}[data-carousel-index="${carouselIndex}"] ${previewSelector}`)
          : [preview];

        previews.forEach((targetPreview) => {
          targetPreview.innerHTML = "";
          const image = document.createElement("img");
          image.src = reader.result;
          image.alt = altText;
          targetPreview.appendChild(image);
        });
      });
      reader.readAsDataURL(file);
    });
  });
}

function setupProofUploads() {
  setupImageUploads(
    "[data-proof-upload]",
    ".whatsapp-proof-card",
    "[data-proof-preview]",
    "Print de conversa do WhatsApp"
  );
}

function setupClientPhotoUploads() {
  setupImageUploads(
    "[data-client-upload]",
    ".client-card",
    "[data-client-preview]",
    "Foto de cliente em viagem"
  );
}

function setupEditMode() {
  // Modo edição: abra o site com "?editar" no final da URL (ex.: index.html?editar)
  // para ver os botões de upload, os cards de print e editar textos.
  // Visitantes comuns veem a página limpa, sem ferramentas de edição.
  const params = new URLSearchParams(window.location.search);
  const isEdit = params.has("editar");
  document.body.classList.toggle("is-edit-mode", isEdit);

  if (!isEdit) {
    document
      .querySelectorAll("[contenteditable='true']")
      .forEach((element) => element.setAttribute("contenteditable", "false"));

    // Cards de cliente ainda sem foto real saem da versão pública.
    // A seção inteira (e seus links) só some se nenhum card tiver foto.
    const clientsSection = document.getElementById("clientes");
    if (clientsSection) {
      clientsSection.querySelectorAll(".client-card").forEach((card) => {
        if (!card.querySelector("[data-client-preview] img")) card.remove();
      });
      const hasRealPhotos = clientsSection.querySelector("[data-client-preview] img");
      if (!hasRealPhotos) {
        clientsSection.hidden = true;
        document.querySelectorAll('a[href="#clientes"]').forEach((link) => {
          link.hidden = true;
        });
      }
    }
  }
}

function setupFaq() {
  const items = document.querySelectorAll(".faq-list details");

  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((otherItem) => {
        if (otherItem !== item) otherItem.open = false;
      });
    });
  });
}

function setupScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const elements = document.querySelectorAll(
    "main > section:not(.hero), .trust-grid > div, .quote-layout > *, .section-heading, .benefit-card, .clients-shell, .client-card, .reviews-shell, .review-card, .conversion-layout > *, .step, .services-section .split > *, .services-list span, .faq-section .split > *, .faq-list details"
  );

  elements.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${(index % 4) * 45}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

document.querySelector("[data-year]").textContent = new Date().getFullYear();
setupEditMode();
updateWhatsAppLinks();
setupHeader();
setupSmoothAnchors();
setupHeroSlider();
setupQuoteForm();
setupDatePickers();
setupPassengerPicker();
setupReviewCarousel();
setupClientCarousel();
setupProofUploads();
setupClientPhotoUploads();
setupFaq();
setupScrollReveal();
