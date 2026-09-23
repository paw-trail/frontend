import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { HeaderLogo } from '@/components/brand/Logo';

/*
 * 개인정보처리방침 — 로그인 없이 열리는 화면 (router 의 RequireSession 바깥)
 *
 * 개인정보 보호법 제30조로 공개해야 하고, 구글 로그인 앱을 게시할 때 이 주소를 등록한다.
 * 적힌 내용은 전부 코드와 설정에서 확인한 사실이다.
 * 서비스가 모으는 값 · 맡기는 곳 · 보관 기간이 바뀌면 이 화면도 함께 고치고 시행일을 바꾼다.
 */
const EFFECTIVE_DATE = '2026년 9월 24일';
const CONTACT_EMAIL = 'privacy@paw-trail.click';

/** 1장 — 무엇을 모으는지 (각 서비스의 DB 마이그레이션 기준) */
const COLLECTED: [string, ReactNode][] = [
  [
    '이메일로 가입',
    '이메일 주소, 비밀번호, 닉네임 — 비밀번호는 원래 값으로 되돌릴 수 없는 방식으로만 저장합니다.',
  ],
  ['구글로 가입 · 로그인', '이메일 주소, 구글 계정 고유 식별값'],
  [
    '서비스를 이용하며 입력',
    <ul key="input" className="list-disc space-y-1 pl-4">
      <li>프로필 사진, 대표 반려동물 지정</li>
      <li>
        반려동물 정보 — 이름, 견종, 크기, 몸무게, 이동장 · 유모차 보유 여부, 예방접종 완료 여부, 접종 증명 가능 여부,
        사진, 메모
      </li>
      <li>즐겨찾기 — 장소, 메모</li>
      <li>방문 기록 — 장소, 방문 일시, 함께한 반려동물, 메모</li>
      <li>일정 — 장소, 방문 예정 일시, 순서, 함께할 반려동물, 메모</li>
      <li>후기 — 평점과 세부 점수, 내용, 사진, 태그, 방문일, 방문 당시 반려동물의 견종 · 몸무게 · 크기, 후기 좋아요</li>
      <li>제보 — 유형, 대상 항목, 제보한 값, 내용, 방문일</li>
      <li>알림 수신 설정</li>
    </ul>,
  ],
  [
    '이용 중에 저절로 생김',
    '접속 IP 주소, 브라우저 정보, 접속 일시, 로그인 기록(로그인 시각, 로그인 유지 기한, 브라우저 정보), 최근 본 장소, 알림 내역, 하루 요약(이용자가 요청할 때 만드는 글)',
  ],
];

/** 3장 — 얼마나 두는지 */
const RETENTION: [string, ReactNode][] = [
  [
    '회원 정보와 이용 기록',
    '회원 탈퇴 시 지체 없이 삭제합니다. 반려동물, 즐겨찾기, 방문 기록, 일정, 후기, 제보, 알림, 하루 요약과 올린 사진이 모두 포함됩니다.',
  ],
  [
    '계정 기록',
    '탈퇴하면 이메일 주소를 되돌릴 수 없는 값으로 바꾸고 구글 계정 식별값을 지웁니다. 그 뒤 남는 계정 번호와 로그인 기록(시각, 브라우저 정보)은 이용자를 알아볼 수 없는 상태로 부정 이용 확인을 위해 보관합니다.',
  ],
  ['이메일 인증 코드', '인증을 마치거나 유효 시간이 지나면 삭제합니다.'],
  ['로그인 유지 정보', '로그아웃하거나 유효 기간이 지나면 삭제합니다.'],
  ['웹 서버 접속 기록', 'IP 주소, 브라우저 정보, 접속 일시, 요청 주소 — 14일 뒤 삭제합니다.'],
  ['서비스 운영 기록', '오류와 처리 과정을 남긴 기록 — 30일 뒤 삭제합니다.'],
];

/** 5장 — 처리를 맡기는 곳과 국외 이전 */
const PROCESSORS: { name: string; policy: string; rows: [string, string][] }[] = [
  {
    name: 'Amazon Web Services, Inc.',
    policy: 'https://aws.amazon.com/privacy/',
    rows: [
      ['맡기는 일', '웹 서버 운영, 사진 저장'],
      ['위치', '대한민국 (서울 리전)'],
      ['넘어가는 항목', '웹 서버 접속 기록, 이용자가 올린 사진'],
      ['시기와 방법', '서비스를 이용하는 동안 암호화된 통신으로'],
      ['보유 기간', '접속 기록은 14일, 사진은 이용자가 지우거나 탈퇴할 때까지'],
    ],
  },
  {
    name: 'Cloudflare, Inc.',
    policy: 'https://www.cloudflare.com/privacypolicy/',
    rows: [
      ['맡기는 일', '접속 보호와 전송 가속'],
      ['위치', '미국 및 전 세계 거점 (이용자와 가까운 곳에서 처리)'],
      ['넘어가는 항목', '접속 IP 주소, 브라우저 정보, 요청 내용'],
      ['시기와 방법', '서비스에 접속할 때마다 암호화된 통신으로'],
      ['보유 기간', 'Cloudflare 개인정보처리방침에 따름'],
    ],
  },
  {
    name: 'Google LLC',
    policy: 'https://policies.google.com/privacy',
    rows: [
      ['맡기는 일', '인증 메일 발송 (Gmail)'],
      ['위치', '미국'],
      ['넘어가는 항목', '받는 사람 이메일 주소, 인증 코드가 담긴 메일 내용'],
      ['시기와 방법', '가입 · 비밀번호 재설정 · 탈퇴 확인 메일을 보낼 때 암호화된 통신으로'],
      ['보유 기간', 'Google 개인정보처리방침에 따름'],
    ],
  },
  {
    name: 'OpenAI, L.L.C.',
    policy: 'https://openai.com/policies/privacy-policy/',
    rows: [
      ['맡기는 일', '하루 요약 작성'],
      ['위치', '미국'],
      [
        '넘어가는 항목',
        '그날 방문하거나 계획한 장소의 이름 · 종류 · 시각 · 메모, 그날 방문한 장소에 남긴 후기의 평점 · 내용 · 방문 당시 견종 — 이메일 등 이용자를 알아볼 수 있는 계정 정보는 보내지 않습니다.',
      ],
      ['시기와 방법', '이용자가 [AI 요약하기]를 누를 때 암호화된 통신으로'],
      ['보유 기간', '모델 학습에 쓰이지 않으며, 남용 감시 기록으로 최대 30일 보관한 뒤 삭제 (OpenAI 정책)'],
    ],
  },
];

/** 11장 — 신고 · 상담 기관 */
const AGENCIES: [string, string, string][] = [
  ['개인정보분쟁조정위원회', '1833-6972', 'https://www.kopico.go.kr'],
  ['개인정보침해신고센터', '국번 없이 118', 'https://privacy.kisa.or.kr'],
  ['대검찰청', '국번 없이 1301', 'https://www.spo.go.kr'],
  ['경찰청', '국번 없이 182', 'https://ecrm.police.go.kr'],
];

/** 법정 필수 항목을 장으로 나눈 방침 본문 — 명세서에 그림이 없어 로그인 화면의 색 · 카드 모양을 따른다 */
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="h-[4.75rem] border-b border-[#ece6da] bg-white">
        <div className="shell flex h-full items-center px-14">
          <Link to="/" aria-label="함께하개 첫 화면">
            <HeaderLogo />
          </Link>
        </div>
      </header>

      <main className="shell px-14 py-12">
        <article className="mx-auto max-w-[56rem] rounded-[1.25rem] bg-white px-14 py-12 shadow-card">
          <h1 className="text-[2rem] font-bold tracking-[-0.01em] text-brand-title">개인정보처리방침</h1>
          <p className="mt-2 text-[0.875rem] text-sub">
            시행일 {EFFECTIVE_DATE} · 운영 팀 네발자국
          </p>

          <p className="mt-8 text-[0.9375rem] leading-[1.8] text-ink">
            팀 네발자국(이하 「우리」)은 반려동물 동반 여행 정보 서비스 「함께하개」(https://paw-trail.click)를 운영하며,
            이용자의 개인정보를 「개인정보 보호법」에 따라 처리합니다. 이 방침은 우리가 어떤 개인정보를 무엇에 쓰고, 얼마나
            보관하며, 누구에게 처리를 맡기는지 알려 드립니다.
          </p>

          <Section no={1} title="처리하는 개인정보와 모으는 방법">
            <Table head={['구분', '항목']} rows={COLLECTED} />
            <P>
              가입 화면과 서비스 화면에서 이용자가 직접 입력한 정보, 구글로 로그인할 때 구글에서 받는 정보, 서비스를 이용하는
              동안 저절로 생기는 정보를 처리합니다.
            </P>
            <P>
              우리는 위치정보를 모으지 않습니다. 「내 위치」 기준의 거리 계산은 이용자의 브라우저 안에서만 이루어지며, 위치를
              우리 서버로 보내거나 저장하지 않습니다. 실명, 전화번호, 생년월일도 모으지 않습니다.
            </P>
          </Section>

          <Section no={2} title="개인정보를 쓰는 목적">
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-[1.8] text-ink">
              <li>회원 식별, 로그인과 로그인 유지, 이메일 인증, 비밀번호 재설정, 탈퇴 확인</li>
              <li>반려동물 정보에 맞춘 장소의 동반 가능 여부 판정과 검색</li>
              <li>즐겨찾기, 방문 기록, 일정, 후기, 제보, 알림 기능 제공</li>
              <li>이용자가 요청할 때 하루 방문 기록의 요약 작성</li>
              <li>부정 이용 방지, 보안, 장애 확인과 대응</li>
            </ul>
            <P>
              위 목적에 필요한 범위에서만 개인정보를 처리하며, 목적이 바뀌면 미리 알리고 필요한 경우 동의를 받습니다.
            </P>
          </Section>

          <Section no={3} title="보관 기간과 파기">
            <Table head={['정보', '보관 기간']} rows={RETENTION} />
            <P>보관 기간이 끝나거나 처리 목적을 이룬 정보는 복구할 수 없는 방법으로 지체 없이 삭제합니다.</P>
          </Section>

          <Section no={4} title="제3자 제공">
            <P>
              우리는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 특별한 규정이 있거나, 수사기관이 법령에
              정한 절차에 따라 요구하는 경우에는 예외로 합니다.
            </P>
          </Section>

          <Section no={5} title="처리 위탁과 국외 이전">
            <P>
              서비스를 운영하기 위해 아래 업체에 개인정보 처리를 맡깁니다. 이 가운데 미국 등 국외로 이전되는 경우는 「개인정보
              보호법」 제28조의8에 따라 이전받는 자, 국가, 항목, 시기와 방법, 목적과 보유 기간을 함께 알립니다.
            </P>
            <div className="mt-4 space-y-4">
              {PROCESSORS.map((p) => (
                <section key={p.name} className="rounded-xl border border-line px-5 py-4">
                  <h3 className="flex flex-wrap items-baseline justify-between gap-2 text-[0.9375rem] font-bold text-ink">
                    {p.name}
                    <a
                      href={p.policy}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.8125rem] font-normal text-brand-strong hover:underline"
                    >
                      개인정보처리방침
                    </a>
                  </h3>
                  <dl className="mt-3 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[0.875rem] leading-relaxed">
                    {p.rows.map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-sub">{label}</dt>
                        <dd className="text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
            <P>
              구글로 로그인하면 이용자는 구글에서 직접 인증하고, 우리는 구글에서 이메일 주소와 계정 식별값만 받습니다.
            </P>
            <P>
              장소 상세의 지도는 이용자의 브라우저가 카카오(Kakao Corp.)의 지도 서비스를 직접 불러와 표시하며, 이때 카카오가
              브라우저의 접속 정보를 받을 수 있습니다. [길찾기]를 누르면 카카오맵으로 이동하며, 위치 사용을 허용한 경우 현재
              위치의 좌표가 카카오맵 주소에 담겨 전달됩니다.
            </P>
            <P>
              서비스에 접속하는 경로(Cloudflare)와 인증 메일 발송(Google)은 서비스 이용에 꼭 필요하므로, 이 이전을 원하지
              않으면 서비스를 이용할 수 없습니다. 하루 요약(OpenAI)은 [AI 요약하기]를 누르지 않으면 이전되지 않습니다.
            </P>
          </Section>

          <Section no={6} title="이용자의 권리와 행사 방법">
            <P>이용자는 언제든지 자신의 개인정보를 열람 · 정정 · 삭제하거나 처리 정지를 요구할 수 있습니다.</P>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-[1.8] text-ink">
              <li>열람 · 정정 — 마이페이지에서 프로필, 반려동물 정보, 기록을 직접 확인하고 고칠 수 있습니다.</li>
              <li>삭제 — 마이페이지의 계정 관리에서 이메일 인증을 거쳐 탈퇴할 수 있으며, 3장의 기준에 따라 삭제합니다.</li>
              <li>
                그 밖의 요구 — 10장의 메일로 요청하면 지체 없이 조치하고 결과를 알립니다. 법정대리인이나 위임을 받은
                사람을 통해서도 요구할 수 있습니다.
              </li>
            </ul>
          </Section>

          <Section no={7} title="쿠키와 브라우저 저장소">
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-[1.8] text-ink">
              <li>
                로그인을 유지하기 위해 쿠키를 씁니다. 이 쿠키는 화면의 스크립트가 읽을 수 없게 만들어져 있습니다. 구글로
                로그인하는 동안에는 요청을 확인하는 쿠키를 5분 동안 씁니다.
              </li>
              <li>광고나 방문 분석을 위한 쿠키는 쓰지 않습니다.</li>
              <li>고른 지역, 판정 기준 같은 화면 설정은 이용자의 브라우저 저장소에 둡니다.</li>
              <li>브라우저 설정에서 쿠키를 막을 수 있지만, 그러면 로그인할 수 없습니다.</li>
            </ul>
          </Section>

          <Section no={8} title="안전성 확보 조치">
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-[1.8] text-ink">
              <li>비밀번호는 원래 값으로 되돌릴 수 없는 방식으로만 저장합니다.</li>
              <li>브라우저와 서버 사이, 서버와 서버 사이의 통신을 암호화합니다.</li>
              <li>서비스마다 데이터베이스와 그 계정을 나누고, 각 계정은 자기 데이터베이스에만 접근합니다.</li>
              <li>사진은 유효 시간이 정해진 서명 주소로만 올리고 볼 수 있습니다.</li>
              <li>관리 기능은 관리자 권한을 가진 계정만 쓸 수 있습니다.</li>
              <li>로그인 시도와 인증 메일 요청의 횟수를 제한합니다.</li>
            </ul>
          </Section>

          <Section no={9} title="만 14세 미만 아동">
            <P>
              함께하개는 만 14세 이상이 이용하는 서비스입니다. 만 14세 미만 아동의 개인정보는 모으지 않으며, 만 14세 미만
              아동의 정보가 모인 사실을 알게 되면 지체 없이 삭제합니다.
            </P>
          </Section>

          <Section no={10} title="개인정보 보호책임자">
            <P>개인정보 처리에 관한 문의, 불만, 피해 구제는 아래로 연락해 주세요. 지체 없이 답하고 처리합니다.</P>
            <dl className="mt-3 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[0.9375rem] leading-[1.8]">
              <dt className="text-sub">담당</dt>
              <dd className="text-ink">팀 네발자국</dd>
              <dt className="text-sub">이메일</dt>
              <dd>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-strong hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </dl>
          </Section>

          <Section no={11} title="권익 침해 구제 방법">
            <P>개인정보 침해에 대한 신고나 상담이 필요하면 아래 기관에 문의할 수 있습니다.</P>
            <ul className="mt-3 space-y-1.5 text-[0.9375rem] leading-[1.8] text-ink">
              {AGENCIES.map(([name, phone, url]) => (
                <li key={name}>
                  {name} — {phone} ·{' '}
                  <a href={url} target="_blank" rel="noreferrer" className="text-brand-strong hover:underline">
                    {url.replace('https://', '')}
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          <Section no={12} title="방침의 변경">
            <P>
              이 방침은 {EFFECTIVE_DATE}부터 적용합니다. 내용이 바뀌면 이 화면에 바뀐 내용과 적용일을 알립니다.
            </P>
          </Section>
        </article>
      </main>
    </div>
  );
}

function Section({ no, title, children }: { no: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[1.25rem] font-bold text-ink">
        {no}. {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[0.9375rem] leading-[1.8] text-ink">{children}</p>;
}

function Table({ head, rows }: { head: string[]; rows: [string, ReactNode][] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-[0.875rem] leading-relaxed">
        <thead className="bg-field text-sub">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-line px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value], i) => {
            const line = i < rows.length - 1 ? 'border-b border-line' : '';
            return (
              <tr key={label} className="align-top">
                <th scope="row" className={`w-[11rem] px-4 py-3 font-semibold text-ink ${line}`}>
                  {label}
                </th>
                <td className={`px-4 py-3 text-ink ${line}`}>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
