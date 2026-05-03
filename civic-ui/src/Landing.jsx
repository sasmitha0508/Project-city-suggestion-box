import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { 
  FaLightbulb, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaChartLine, 
  FaChevronDown, 
  FaChevronLeft, 
  FaChevronRight,
  FaTools,
  FaTint,
  FaTrashAlt,
  FaBus,
  FaTree,
  FaRoad,
  FaHospitalUser,
  FaShieldAlt,
  FaTrafficLight
} from 'react-icons/fa';
import { IoIosRocket } from "react-icons/io";
import { RiCustomerService2Fill } from 'react-icons/ri';
import { MdOutlineVerified, MdOutlineFeedback } from 'react-icons/md';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Landing.css';
import { useLanguage } from './contexts/LanguageContext';
import { landingEn } from './translations/landing-en';
import { landingTa } from './translations/landing-ta';

const FeaturesSlider = () => {
  const { language } = useLanguage();
  const t = language === 'ta' ? landingTa : landingEn;
  
  const features = [
    {
      icon: <FaMapMarkerAlt />,
      img: "https://static.vecteezy.com/system/resources/previews/000/451/841/non_2x/urban-area-of-the-city-infrastructure-vector.jpg",
      title: t.locationBased,
      desc: t.locationDesc
    },
    {
      icon: <FaUsers />,
      img: "https://static.vecteezy.com/system/resources/previews/009/797/520/large_2x/vote-ballot-box-people-putting-pepper-vote-into-the-box-election-concept-democracy-freedom-of-speech-justice-voting-and-opinion-referendum-and-poll-choice-event-illustration-vector.jpg",
      title: t.communityVoting,
      desc: t.communityDesc
    },
    {
      icon: <FaChartLine />,
      img: "https://png.pngtree.com/background/20231027/original/pngtree-d-rendered-concept-illustrating-data-analysis-in-digital-marketing-and-seo-picture-image_5749893.jpg",
      title: t.realTimeAnalytics,
      desc: t.analyticsDesc
    },
    {
      icon: <MdOutlineVerified />,
      img: "https://img.freepik.com/free-vector/verified-concept-illustration_114360-5138.jpg",
      title: t.verifiedImplementation,
      desc: t.verifiedDesc
    },
    {
      icon: <RiCustomerService2Fill />,
      img: "https://tse4.mm.bing.net/th/id/OIP.gYtgmrqYJdt0NuQ8C5paOgAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
      title: t.directResponses,
      desc: t.responsesDesc
    },
    {
      icon: <MdOutlineFeedback />,
      img: "https://static.vecteezy.com/system/resources/thumbnails/003/235/390/small_2x/customer-gives-a-review-in-online-shop-scene-illustration-vector.jpg",
      title: t.feedbackLoop,
      desc: t.feedbackDesc
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <Slider {...settings} className="features-carousel">
      {features.map((feature, index) => (
        <div key={index} className="feature-slide">
          <div className="feature-card">
            <div className="feature-image">
              <img src={feature.img} alt={feature.title} />
              <div className="feature-icon">{feature.icon}</div>
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </div>
        </div>
      ))}
    </Slider>
  );
};

const DepartmentSection = () => {
  const { language } = useLanguage();
  const t = language === 'ta' ? landingTa : landingEn;
  
  const departments = [
    {
      id: 1,
      icon: <FaRoad />,
      title: t.roadsPotholes,
      count: `1,500 ${t.reports}`,
    },
    {
      id: 2,
      icon: <FaTint />,
      title: t.waterDrainage,
      count: `2,340 ${t.reports}`,
    },
    {
      id: 3,
      icon: <FaTrashAlt />,
      title: t.wasteSanitation,
      count: `1,980 ${t.reports}`,
    },
    {
      id: 4,
      icon: <FaTrafficLight />,
      title: t.trafficSignals,
      count: `1,205 ${t.reports}`,
    },
    {
      id: 5,
      icon: <FaLightbulb />,
      title: t.streetLighting,
      count: `1,120 ${t.reports}`,
    },
    {
      id: 6,
      icon: <FaTree />,
      title: t.parksRecreation,
      count: `875 ${t.reports}`,
    },
    {
      id: 7,
      icon: <FaHospitalUser />,
      title: t.publicHealth,
      count: `940 ${t.reports}`,
    },
    {
      id: 8,
      icon: <FaShieldAlt />,
      title: t.safetySecurity,
      count: `710 ${t.reports}`,
    },
  ];

  const Arrow = ({ className, style, onClick, direction }) => {
    return (
      <button
        className={`dept-arrow ${direction} ${className || ""}`}
        style={{ ...style }}
        onClick={onClick}
        aria-label={direction === "prev" ? "Previous" : "Next"}
      >
        <span className="arrow-icon">{direction === "prev" ? "‹" : "›"}</span>
      </button>
    );
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 550,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2800,
    cssEase: "ease-in-out",
    nextArrow: <Arrow direction="next" />,
    prevArrow: <Arrow direction="prev" />,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3 } },
      { breakpoint: 992, settings: { slidesToShow: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <section className="departments">
      <div className="dept-container">
        <div className="dept-header">
          <div className="dept-left">
            <span className="dept-eyebrow">{t.departments}</span>
            <h2 className="dept-title">
              {t.chooseYourConcern}
            </h2>
          </div>
          <p className="dept-desc">
            {t.departmentsDescription}
          </p>
        </div>

        <div className="dept-slider-wrap">
          <Slider {...settings}>
            {departments.map((d, i) => (
              <div key={d.id} className="dept-slide">
                <article
                  className="dept-card"
                  style={{ animationDelay: `${(i % 5) * 0.08}s` }}
                >
                  <div className="dept-card-bg" aria-hidden="true" />
                  <div className="dept-icon">{d.icon}</div>

                  <div className="dept-info">
                    <span className="dept-count">{d.count}</span>
                    <h3 className="dept-name">{d.title}</h3>
                  </div>
                </article>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = language === 'ta' ? landingTa : landingEn;
  
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: t.urbanPlanner,
      content: t.testimonial1,
      city: "Portland, OR"
    },
    {
      name: "Michael Chen",
      role: t.councilMember,
      content: t.testimonial2,
      city: "Austin, TX"
    },
    {
      name: "Elena Rodriguez",
      role: t.communityOrganizer,
      content: t.testimonial3,
      city: "Miami, FL"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="city-suggestion-app" dir={language === 'ta' ? 'ltr' : 'ltr'}>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="logo">
            <FaLightbulb className="logo-icon" />
            <span>CitySuggestion<span>Box</span></span>
          </div>
          <div className="nav-links">
            <a href="#home" onClick={() => scrollToSection('home')}>{t.home}</a>
            <a href="#features" onClick={() => scrollToSection('features')}>{t.features}</a>
            <a href="#departments" onClick={() => scrollToSection('departments')}>{t.departments}</a>
            <a href="#how-it-works" onClick={() => scrollToSection('how-it-works')}>{t.howItWorks}</a>
            <a href="#testimonials" onClick={() => scrollToSection('testimonials')}>{t.successStories}</a>
          </div>
          <div className="auth-buttons">
            <button className="language-toggle" onClick={toggleLanguage}>
              {language === 'ta' ? 'EN' : 'தமிழ்'}
            </button>
            <button className="sign-up-btn" onClick={handleSignUpClick}>{t.signUp}</button>
            <button className="sign-in-btn" onClick={handleLoginClick}>{t.login}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>{t.shapeYourCity}</h1>
            <p className="subtitle">{t.yourIdeas}</p>
            <p>{t.heroDescription}</p>
            <div className="cta-buttons">
              <button className="primary-btn" onClick={handleSignUpClick}>{t.submitYourIdea}</button>
              <button className="secondary-btn" onClick={() => scrollToSection('how-it-works')}>
                {t.howItWorks} <FaChevronDown />
              </button>
            </div>
          </div>
           <div className="hero-image">
            <div className="city-map-animation">
              <div className="pulse-dot dot-1"></div>
              <div className="pulse-dot dot-2"></div>
              <div className="pulse-dot dot-3"></div>
              <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="City illustration" />
            </div>
          </div>
        </div>
        <div className="scroll-down" onClick={() => scrollToSection('features')}>
          <FaChevronDown />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <p className="section-subtitle">{t.ourFeatures}</p>
          <h2 className="section-title">{t.whyChooseOurPlatform}</h2>
          <FeaturesSlider />
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="departments">
        <div className="container">
          <DepartmentSection />
        </div>
      </section>
   
      {/* How It Works Section */}
      <section id="how-it-works" className="how-section">
        <div className="how-container">
          <p className="how-subtitle">{t.workingProcess}</p>
          <h2 className="how-title">{t.howItWorksTitle}</h2>

          <div className="how-cards">
            {/* Step 1 */}
            <div className="how-card">
              <span className="step-number">01</span>
              <div className="title-box blue">
                <div className="icon-box">
                  <FaLightbulb />
                </div>
                <div className="title-text">
                  <h3>{t.submit}</h3>
                  <p>{t.yourIdea}</p>
                </div>
              </div>
              <p className="card-text">
                {t.submitDesc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="how-card">
              <span className="step-number">02</span>
              <div className="title-box purple">
                <div className="icon-box">
                  <FaUsers />
                </div>
                <div className="title-text">
                  <h3>{t.community}</h3>
                  <p>{t.engagement}</p>
                </div>
              </div>
              <p className="card-text">
                {t.communityDesc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="how-card">
              <span className="step-number">03</span>
              <div className="title-box green">
                <div className="icon-box">
                  <IoIosRocket />
                </div>
                <div className="title-text">
                  <h3>{t.implementation}</h3>
                  <p>{t.feedback}</p>
                </div>
              </div>
              <p className="card-text">
                {t.implementationDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <h2 className="section-title">{t.successStoriesTitle}</h2>
          <p className="section-subtitle">{t.transformingCities}</p>
          
          <div className="testimonial-carousel">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`testimonial-card ${index === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
              >
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}, {testimonial.city}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="testimonial-nav">
              {testimonials.map((_, index) => (
                <button 
                  key={index} 
                  className={`nav-dot ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
          
          <div className="case-studies">
            <div className="case-study">
              <div className="case-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60)' }}></div>
              <div className="case-content">
                <h3>{t.downtownPlaza}</h3>
                <p>{t.plazaDesc}</p>
                <div className="case-stats">
                  <span>2,300+ {t.votes}</span>
                  <span>{t.implemented}</span>
                </div>
              </div>
            </div>
            
            <div className="case-study">
              <div className="case-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60)' }}></div>
              <div className="case-content">
                <h3>{t.bikeLanes}</h3>
                <p>{t.bikeLanesDesc}</p>
                <div className="case-stats">
                  <span>1,800+ {t.suggestions}</span>
                  <span>{t.completedPhases}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">
            <FaLightbulb className="logo-icon" />
            <span>CitySuggestion<span>Box</span></span>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>{t.product}</h4>
              <a href="#">{t.features}</a>
              <a href="#">{t.pricing}</a>
              <a href="#">API</a>
              <a href="#">{t.integrations}</a>
            </div>
            
            <div className="link-group">
              <h4>{t.resources}</h4>
              <a href="#">{t.documentation}</a>
              <a href="#">{t.caseStudies}</a>
              <a href="#">{t.communityFooter}</a>
              <a href="#">{t.blog}</a>
            </div>
            
            <div className="link-group">
              <h4>{t.company}</h4>
              <a href="#">{t.aboutUs}</a>
              <a href="#">{t.careers}</a>
              <a href="#">{t.press}</a>
              <a href="#">{t.contact}</a>
            </div>
            
            <div className="link-group">
              <h4>{t.legal}</h4>
              <a href="#">{t.privacy}</a>
              <a href="#">{t.terms}</a>
              <a href="#">{t.security}</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} CitySuggestion Box. {t.allRights}</p>
            <div className="footer-social">
              <a href="#">{t.privacyPolicy}</a>
              <a href="#">{t.termsOfService}</a>
              <a href="#">{t.cookiePolicy}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;