import { useEffect, useState } from "react";
import { PAGE_TO_PATH, PATH_TO_PAGE } from "../config/navigation";

function normalizedPath() {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path || "/dashboard";
}

export default function usePageRoute(defaultPage = "Dashboard") {
  const initialPage =
    PATH_TO_PAGE[normalizedPath()] ||
    defaultPage;

  const [activePage, setActivePageState] =
    useState(initialPage);

  useEffect(() => {
    const handlePopState = () => {
      setActivePageState(
        PATH_TO_PAGE[normalizedPath()] ||
        defaultPage
      );
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [defaultPage]);

  function setActivePage(page) {
    const nextPage =
      PAGE_TO_PATH[page]
        ? page
        : "Dashboard";

    const nextPath =
      PAGE_TO_PATH[nextPage];

    if (
      window.location.pathname !==
      nextPath
    ) {
      window.history.pushState(
        {},
        "",
        nextPath
      );
    }

    setActivePageState(nextPage);
  }

  return [
    activePage,
    setActivePage
  ];
}
