import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Virhe kaappattu ErrorBoundaryssa:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h3 style={{ color: "red" }}>⚠️ Jokin meni pieleen. Päivitä sivu.</h3>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
