"use client";

import { ArrowRight, CheckCircle2, LockKeyhole, Mail, MapPin, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { sendMagicLink } from "../lib/supabase-client";

export default function PrivateLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không gửi được liên kết đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-visual">
        <img src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1500&q=86" alt="Phố cổ bên sông vào buổi tối" />
        <div className="login-visual-overlay" />
        <div className="login-brand"><span className="brand-mark"><MapPin size={18} fill="currentColor" /></span><strong>Đi Đâu Đây</strong></div>
        <div className="login-quote"><span>Chuyến đi đáng nhớ bắt đầu từ một kế hoạch nhẹ nhàng.</span><p>Lịch trình, ảnh đẹp và khách sạn của bạn ở cùng một nơi.</p></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="login-lock"><LockKeyhole size={22} /></span>
          <p className="eyebrow">Không gian riêng tư</p>
          <h1>Chào mừng trở lại</h1>
          <p className="login-intro">Nhập email để nhận liên kết đăng nhập an toàn. Không cần ghi nhớ mật khẩu.</p>
          {sent ? (
            <div className="magic-sent"><CheckCircle2 size={28} /><h2>Kiểm tra email của bạn</h2><p>Chúng tôi vừa gửi liên kết đăng nhập tới <strong>{email}</strong>.</p><button type="button" className="text-button" onClick={() => setSent(false)}>Dùng email khác</button></div>
          ) : (
            <form onSubmit={submit} className="login-form">
              <label htmlFor="login-email">Email</label>
              <div className="input-with-icon"><Mail size={17} /><input id="login-email" type="email" required autoComplete="email" placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="primary-button login-submit" type="submit" disabled={loading}>{loading ? "Đang gửi…" : "Gửi liên kết đăng nhập"}<ArrowRight size={17} /></button>
            </form>
          )}
          <div className="privacy-note"><ShieldCheck size={16} /><span>Dữ liệu chuyến đi chỉ hiển thị cho tài khoản của bạn.</span></div>
        </div>
      </section>
    </main>
  );
}
