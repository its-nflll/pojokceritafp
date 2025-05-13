import Api from '../../data/api';
import NotificationHelper from '../../utils/notification-helper';

export default class LoginPage {
  async render() {
    return `
      <section class="container login-container">
        <h1>Login</h1>
        <form id="loginForm" class="login-form" autocomplete="on">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              placeholder="Masukkan email"
              autocomplete="email">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required
              minlength="8"
              placeholder="Masukkan password"
              autocomplete="current-password">
          </div>
          <button type="submit" class="login-button">Login</button>
        </form>
        <p id="errorMessage" class="error-message" aria-live="polite"></p>
        <form id="registerForm" class="login-form" style="display:none; margin-top:2rem;" autocomplete="on">
          <h2 style="text-align:center; color:#1b4636; margin-bottom:1.2rem; font-size:1.3rem;">Register</h2>
          <div class="form-group">
            <label for="reg-name">Nama</label>
            <input 
              type="text" 
              id="reg-name" 
              name="name" 
              required
              placeholder="Masukkan nama lengkap"
              autocomplete="name">
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input 
              type="email" 
              id="reg-email" 
              name="email" 
              required
              placeholder="Masukkan email"
              autocomplete="email">
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input 
              type="password" 
              id="reg-password" 
              name="password" 
              required
              minlength="8"
              placeholder="Masukkan password (min. 8 karakter)"
              autocomplete="new-password">
          </div>
          <button type="submit" class="login-button">Register</button>
          <p id="registerMessage" class="error-message" aria-live="polite"></p>
          <div class="register-link">
            <span>Sudah punya akun? <a href="#" id="showLogin">Login</a></span>
          </div>
        </form>
        <div class="register-link" id="showRegisterContainer" style="text-align:center; margin-top:1.5rem;">
          <span><a href="#" id="showRegister">Buat akun</a></span>
      </section>
    `;
  }

  async afterRender() {
    // Login logic
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const showRegister = document.getElementById('showRegister');
    const registerForm = document.getElementById('registerForm');
    const showLogin = document.getElementById('showLogin');
    const registerMessage = document.getElementById('registerMessage');
    const showRegisterContainer = document.getElementById('showRegisterContainer');

    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      errorMessage.textContent = '';
      registerForm.style.display = 'block';
      showRegisterContainer.style.display = 'none';
    });

    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.style.display = 'none';
      registerMessage.textContent = '';
      loginForm.style.display = 'block';
      showRegisterContainer.style.display = 'block';
    });

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = '';

      const email = loginForm.email.value;
      const password = loginForm.password.value;

      try {
        const response = await Api.login({ email, password });

        if (response.error) {
          throw new Error(response.message || 'Login gagal');
        }

        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('userId', response.loginResult.userId);
        localStorage.setItem('name', response.loginResult.name);

        // Request push notification permission after successful login
        await NotificationHelper.requestPermission();

        window.location.hash = '#/';
      } catch (err) {
        errorMessage.textContent = err.message;
      }
    });

    // Register logic
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      registerMessage.textContent = '';
      registerMessage.style.color = '#d32f2f';

      const name = registerForm.name.value;
      const email = registerForm.email.value;
      const password = registerForm.password.value;

      try {
        const response = await Api.register({ name, email, password });

        if (response.error) {
          throw new Error(response.message || 'Registrasi gagal');
        }

        registerMessage.style.color = '#388e3c';
        registerMessage.textContent = 'Registrasi berhasil! Silakan login.';
        setTimeout(() => {
          registerForm.style.display = 'none';
          loginForm.style.display = 'block';
          registerMessage.textContent = '';
          showRegisterContainer.style.display = 'block';
        }, 1200);
      } catch (err) {
        registerMessage.textContent = err.message;
      }
    });
  }
}
