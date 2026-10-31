import type en from './en';

type TranslationShape<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};

const vi = {
  boilerplate: {
    common_appName: { full: 'Mindy Mobile', initials: 'Mindy' },
    common_error: 'Đã xảy ra lỗi.',
    screen_example: {
      hello_user: 'Xin chào, tôi là {{name}}',
      title: 'Chào mừng đến với $t(boilerplate.common_appName.full)',
      description:
        'Màn hình demo boilerplate để kiểm tra API, giao diện và ngôn ngữ.',
      explore_features: 'Khám phá tính năng',
      features: {
        api_integration: {
          title: 'Kết nối API',
          description: 'Kiểm tra kết nối sau khi cấu hình API_URL',
          button: 'Thử kết nối API',
        },
        theme_toggle: {
          title: 'Giao diện',
          description: 'Chuyển giao diện sáng và tối',
          button: 'Đổi giao diện',
        },
        language_switch: {
          title: 'Ngôn ngữ',
          description: 'Chuyển tiếng Việt và tiếng Anh',
          button: 'Đổi ngôn ngữ',
        },
      },
      api_messages: {
        success_title: 'Thành công',
        success_message: 'Xin chào {{firstName}} {{lastName}}!',
        success_button: 'OK',
        error_title: 'Lỗi',
        error_message:
          'Không thể tải dữ liệu. Vui lòng kiểm tra cấu hình và thử lại.',
        error_button: 'OK',
      },
      stats: {
        title: 'Thống kê boilerplate',
        components: 'Thành phần',
        utilities: 'Tiện ích',
        languages: 'Ngôn ngữ',
        possibilities: 'Khả năng',
      },
    },
    error_boundary: {
      title: 'Đã xảy ra lỗi.',
      description: 'Vui lòng thử lại sau.',
      cta: 'Tải lại màn hình',
    },
  },
} satisfies TranslationShape<typeof en>;

export default vi;
