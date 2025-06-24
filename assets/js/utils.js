let isStaticOnTop = false;

function setBannerTitle(newTitle= "Agustin Lehmann Portafolio") {
    const titleElement = document.getElementById('bannerTitle');
  
    // Fade out
    titleElement.style.opacity = 0;
  
    setTimeout(() => {
      titleElement.textContent = newTitle;
      // Fade in
      titleElement.style.opacity = 1;
    }, 400); // matches transition duration
  }

function openModal(htmlPath) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
  
    overlay.classList.remove('hidden');
    content.innerHTML = "Loading...";

    fetch(htmlPath)
      .then(res => res.text())
      .then(html => {
          content.innerHTML = html;
      })
      .catch(err => {
          content.innerHTML = `<p style="color: red">Error loading content.</p>`;
          console.error("Failed to load modal content:", err);
      });
}


document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    setBannerTitle();
});

document.getElementById("hamburgerButton").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
});

const hambugerItems = {
  "1": {
      label: "About",
      iconPath: "aboutMe.svg",
      action: () => {
          console.log("Clicked About");
          setBannerTitle("About");
      }
  },
  "15": {
      label: "Skills",
      iconPath: "skills.svg",
      action: () => {
          console.log("Clicked Skills");
          setBannerTitle("Skills");
          openModal("assets/popupwindows/skills.html");
      }
  },
  "64": {
      label: "Projects",
      iconPath: "projects.svg",
      action: () => {
          console.log("Clicked Projects");
          setBannerTitle("Projects");
          zoomIntoNode("64");
          updateArrowVisibility();
      }
  },
  "176": {
      label: "Contact",
      iconPath: "contact.svg",
      action: () => {
          console.log("Clicked Contact");
          setBannerTitle("Contact");
      }
  },
  "230": {
      label: "Resume",
      iconPath: "cv.svg",
      action: () => {
          console.log("Clicked Resume");
          setBannerTitle("Resume");
          openModal("assets/popupwindows/resume.html")
      }
  }
};

function swapCanvasZIndex() {
  const staticCanvas = document.getElementById('staticCanvas');
  const graphCanvas = document.getElementById('graphCanvas');

  if (isStaticOnTop) {
    staticCanvas.style.zIndex = 1;
    graphCanvas.style.zIndex = 2;
  } else {
    staticCanvas.style.zIndex = 2;
    graphCanvas.style.zIndex = 1;
  }

  isStaticOnTop = !isStaticOnTop;
}

// Hook specific menu items to node actions
document.getElementById("menuAbout").addEventListener("click", () => {
  hambugerItems["1"].action();
  closeSidebar();
});
document.getElementById("menuSkills").addEventListener("click", () => {
  hambugerItems["15"].action();
  closeSidebar();
});
document.getElementById("menuProjects").addEventListener("click", () => {
  hambugerItems["64"].action();
  closeSidebar();
});
document.getElementById("menuContact").addEventListener("click", () => {
  hambugerItems["176"].action();
  closeSidebar();
});
document.getElementById("menuResume").addEventListener("click", () => {
  hambugerItems["230"].action();
  closeSidebar();
});

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("show");
}

function scrollCarousel(direction) {
  const carousel = document.getElementById('carrusel');
  const itemWidth = carousel.offsetWidth;
  carousel.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
}

